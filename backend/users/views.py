from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from rest_framework.response import Response

from go4surprise.settings import DEBUG, GS_PUNTERO
from .tokens_custom import custom_token_generator
from .serializers import RegisterSerializer, LoginSerializer, PreferencesSerializer, UserSerializer, UserUpdateSerializer
from .models import Preferences
from django.contrib.auth.models import User
from .models import Usuario
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from .serializers import SocialLoginResponseSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from decouple import config
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from django.conf import settings

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from datetime import datetime

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from bookings.models import Booking



logger = logging.getLogger(__name__)


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter

    def get_response(self):
        user = self.user
        try:
            usuario = user.usuario
            # Para autenticación social, marcamos el email como verificado automáticamente
            usuario.email_verified = True
            usuario.save()
        except Usuario.DoesNotExist:
            logger.error(f"get_response - No Usuario found for user {user.username}")
            # Create it here as a fallback (though save_user should handle this)
            extra_data = self.sociallogin.account.extra_data
            usuario = Usuario.objects.create(
                user=user,
                name=user.first_name or extra_data.get('given_name', ''),
                surname=user.last_name or extra_data.get('family_name', ''),
                email=user.email,
                phone='',
                birthdate='2000-01-01',
                email_verified=True,  # Marcamos como verificado para autenticación social
            )
        serializer = SocialLoginResponseSerializer(usuario, context={'request': self.request})
        data = serializer.data
        logger.info(f"Google login response: {data}")
        return Response(data)


@swagger_auto_schema(
    method="post",
    request_body=RegisterSerializer,
    responses={
        201: openapi.Response("Usuario registrado correctamente"),
        400: openapi.Response("Error en la validación"),
    },
    operation_summary="Registro de usuario",
    operation_description="Registra un nuevo usuario con nombre, apellido, email, teléfono y contraseña.",
)
@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        
        # Generar el token de verificación
        verification_token = usuario.email_verification_token
        
        # Construir el enlace de verificación
        base_url = "http://localhost:8081" if DEBUG else f"https://{GS_PUNTERO}-go4-frontend-dot-ispp-2425-g10.ew.r.appspot.com"
        verification_link = f"{base_url}/VerifyEmail?token={verification_token}&user_id={usuario.id}"
        
        # Enviar email de verificación
        subject = "Verifica tu correo electrónico - Go4Surprise"
        html_content = render_to_string("emails/email_verificacion.html", {
            "usuario": usuario,
            "verification_link": verification_link,
            "year": datetime.now().year,
        })
        text_content = f"""Hola {usuario.name},

        Gracias por registrarte en Go4Surprise. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.

        Por favor, haz clic en el siguiente enlace para verificar tu correo:
        {verification_link}

        Este enlace expirará en 48 horas.

        Si no has sido tú quien se ha registrado, puedes ignorar este mensaje.

        Saludos,
        El equipo de Go4Surprise
        """

        try:
            email = EmailMultiAlternatives(subject, text_content, config('DEFAULT_FROM_EMAIL'), [usuario.email])
            email.attach_alternative(html_content, "text/html")
            email.send()
        except Exception as e:
            logger.error(f"Error al enviar email de verificación: {str(e)}")
        
        return Response({
            "message": "Usuario correctamente creado. Por favor, verifica tu correo electrónico para activar tu cuenta.",
            "id": usuario.id,
            "username": usuario.user.username,
            "name": usuario.name,
            "surname": usuario.surname,
            "email": usuario.email,
            "verification_sent": True,
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method="post",
    request_body=LoginSerializer,
    responses={
        200: openapi.Response("Login exitoso"),
        400: openapi.Response("Credenciales inválidas"),
        403: openapi.Response("Email no verificado"),
    },
    operation_summary="Inicio de sesión",
    operation_description="Autentica al usuario y devuelve un token JWT.",
)
@api_view(['POST'])
def login_user(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        # Obtenemos el usuario del serializador
        username = serializer.validated_data.get('username')
        user = User.objects.get(username=username)
        try:
            usuario = user.usuario
            # Verificamos si el correo ha sido verificado
            if not usuario.email_verified:
                # Verificamos si han pasado 48 horas desde el registro
                if usuario.is_verification_expired:
                    # Eliminamos el usuario si ha expirado
                    user.delete()  # Esto eliminará también el Usuario por la cascada
                    return Response(
                        {"error": "Tu cuenta ha sido eliminada porque no verificaste tu correo electrónico en las 48 horas establecidas. Por favor, regístrate de nuevo."},
                        status=status.HTTP_403_FORBIDDEN)
                else:
                    # Enviamos un nuevo correo de verificación si lo solicita
                    if request.data.get('resend_verification'):
                        usuario.refresh_verification_token()
                        base_url = "http://localhost:8081" if DEBUG else f"https://{GS_PUNTERO}-go4-frontend-dot-ispp-2425-g10.ew.r.appspot.com"
                        verification_link = f"{base_url}/VerifyEmail?token={usuario.email_verification_token}&user_id={usuario.id}"
                        subject = "Verifica tu correo electrónico - Go4Surprise"
                        html_content = render_to_string("emails/email_verificacion.html", {
                            "usuario": usuario,
                            "verification_link": verification_link,
                            "year": datetime.now().year,
                        })
                        text_content = f"""Hola {usuario.name},

                        Gracias por registrarte en Go4Surprise. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.

                        Por favor, haz clic en el siguiente enlace para verificar tu correo:
                        {verification_link}

                        Este enlace expirará en 48 horas.

                        Si no has sido tú quien se ha registrado, puedes ignorar este mensaje.

                        Saludos,
                        El equipo de Go4Surprise
                        """

                        try:
                            email = EmailMultiAlternatives(subject, text_content, config('DEFAULT_FROM_EMAIL'), [usuario.email])
                            email.attach_alternative(html_content, "text/html")
                            email.send()
                        except Exception as e:
                            logger.error(f"Error al enviar email de verificación: {str(e)}")
                        
                        return Response(
                            {"message": "Se ha enviado un nuevo correo de verificación. Por favor, verifica tu cuenta."},
                            status=status.HTTP_200_OK)
                    
                    return Response(
                        {"error": "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada."},
                        status=status.HTTP_403_FORBIDDEN)
            
            # Si el correo está verificado, continúa con el login normal
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
            
        except Usuario.DoesNotExist:
            return Response({"error": "Perfil de usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter('token', openapi.IN_QUERY, description="Token de verificación", type=openapi.TYPE_STRING),
        openapi.Parameter('user_id', openapi.IN_QUERY, description="ID del usuario", type=openapi.TYPE_STRING),
    ],
    responses={
        200: openapi.Response("Email verificado correctamente"),
        400: openapi.Response("Token inválido o expirado"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Verificar email",
    operation_description="Verifica el correo electrónico del usuario.",
)
@api_view(['GET'])
def verify_email(request):
    token = request.query_params.get('token')
    user_id = request.query_params.get('user_id')
    
    if not token or not user_id:
        return Response({"error": "Token y user_id son requeridos"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        usuario = Usuario.objects.get(id=user_id)
        
        # Verificar si el token coincide
        if str(usuario.email_verification_token) != token:
            return Response({"error": "Token de verificación inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el token ha expirado
        if usuario.is_verification_expired:
            # Si ha expirado, eliminamos el usuario
            user = usuario.user
            user.delete()  # Esto eliminará también el Usuario por la cascada
            return Response({"error": "El token de verificación ha expirado. Por favor, regístrate de nuevo."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Activar la cuenta
        usuario.email_verified = True
        usuario.save()
        
        # Generar tokens para permitir al usuario iniciar sesión directamente
        refresh = RefreshToken.for_user(usuario.user)
        
        return Response({
            "message": "Correo electrónico verificado correctamente. Ya puedes utilizar tu cuenta.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user_id": usuario.user.id,
            "id": usuario.id
        }, status=status.HTTP_200_OK)
        
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)


@swagger_auto_schema(
    method="patch",
    request_body=PreferencesSerializer,
    responses={
        200: openapi.Response("Preferencias actualizadas correctamente"),
        400: openapi.Response("Error en la validación"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Actualizar preferencias del usuario",
    operation_description="Permite al usuario autenticado actualizar sus preferencias.",
)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    try:
        preferences = request.user.usuario.preferences
    except Preferences.DoesNotExist:
        preferences = Preferences.objects.create(usuario=request.user.usuario)

    data = request.data
    print("Datos recibidos:", data)  

    invalid_fields = {}

    for category in ['music', 'culture', 'sports', 'gastronomy', 'nightlife', 'adventure']:
        if category in data:
            if not isinstance(data[category], list):  # Validar que sea una lista
                invalid_fields[category] = "Debe ser una lista"
            else:
                preferences.__setattr__(category, data[category])

    # Si hay errores, devolver un 400
    if invalid_fields:
        return Response({"error": "Datos inválidos", "detalles": invalid_fields}, status=status.HTTP_400_BAD_REQUEST)

    serializer = PreferencesSerializer(preferences, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Devuelve la información del usuario autenticado"""
    user = request.user.usuario  # Asegúrate de que `usuario` es la relación correcta
    serializer = UserSerializer(user)  
    return Response(serializer.data, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method="get",
    manual_parameters=[
        openapi.Parameter('user_id', openapi.IN_QUERY, description="ID del usuario", type=openapi.TYPE_INTEGER)
    ],
    responses={
        200: openapi.Response("ID del Usuario encontrado"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Obtener ID del Usuario",
    operation_description="Devuelve el ID de la entidad Usuario según la propiedad user_id.",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_usuario_id(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response({"error": "user_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        usuario = Usuario.objects.get(user=user)
        return Response({"usuario_id": usuario.id}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Usuario.DoesNotExist:
        return Response({"error": "Entidad Usuario no encontrada"}, status=status.HTTP_404_NOT_FOUND)


@swagger_auto_schema(
    method="put",
    request_body=UserUpdateSerializer,
    responses={
        200: openapi.Response("Perfil actualizado correctamente"),
        400: openapi.Response("Error en la validación"),
    },
    operation_summary="Actualizar perfil del usuario",
    operation_description="Permite al usuario autenticado actualizar su perfil, incluyendo nombre, apellido, email, teléfono y nombre de usuario.",
)
@api_view(['PUT'])
@parser_classes([MultiPartParser, FormParser, JSONParser]) 
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    try:
        user = request.user.usuario  # Asegúrate de que `usuario` es la relación correcta
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@swagger_auto_schema(
    method="delete",
    responses={
        204: openapi.Response("Cuenta eliminada correctamente"),
        400: openapi.Response("Error al eliminar la cuenta"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Eliminar cuenta de usuario",
    operation_description="Permite al usuario autenticado eliminar su cuenta de forma permanente.",
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_account(request):
    """Elimina la cuenta del usuario autenticado y sus reservas asociadas"""
    try:
        user = request.user
        usuario = user.usuario  # Relación con el modelo Usuario

        # Eliminar reservas asociadas
        Booking.objects.filter(user=usuario).delete()

        # Eliminar usuario
        usuario.delete()
        user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error al eliminar cuenta: {str(e)}")
        return Response({"error": f"Error al eliminar la cuenta: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method="post",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'current_password': openapi.Schema(type=openapi.TYPE_STRING, description="Contraseña actual"),
            'new_password': openapi.Schema(type=openapi.TYPE_STRING, description="Nueva contraseña")
        },
        required=['current_password', 'new_password'],
    ),
    responses={
        200: openapi.Response("Contraseña cambiada exitosamente"),
        400: openapi.Response("Error en la validación"),
        401: openapi.Response("Contraseña actual incorrecta"),
    },
    operation_summary="Cambiar contraseña",
    operation_description="Permite al usuario autenticado cambiar su contraseña verificando la actual."
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user

    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")

    if not current_password or not new_password:
        return Response({"error": "Ambas contraseñas son requeridas"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({"error": "Contraseña actual incorrecta"}, status=status.HTTP_401_UNAUTHORIZED)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Contraseña actualizada correctamente"}, status=status.HTTP_200_OK)


@api_view(['GET'])
def check_username_exists(request, username):
    if not username:
        return JsonResponse({'error': 'El nombre del usuario no puede estar vacío'}, status=400)
    
    exists = User.objects.filter(username=username).exists()
    return JsonResponse({'exists': exists})



@api_view(['POST'])
def password_reset(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = Usuario.objects.filter(email=email).first()

    if not usuario:
        return Response({'error': 'No user found with that email'}, status=status.HTTP_404_NOT_FOUND)
    
    user = usuario.user
    
    # Generar enlace con el UUID de Usuario y token
    uidb64 = urlsafe_base64_encode(force_bytes(str(usuario.id)))  
    token = custom_token_generator.make_token(user)
    base_url = "http://localhost:8081" if DEBUG else f"https://{GS_PUNTERO}-go4-frontend-dot-ispp-2425-g10.ew.r.appspot.com"
    reset_link = f"{base_url}/PasswordResetConfirm?uidb64={uidb64}&token={token}"

    # Enviar email
    subject = "Recupera tu contraseña - Go4Surprise"
    html_content = render_to_string("emails/password_reset.html", {
        "usuario": usuario,
        "reset_link": reset_link,
        "year": datetime.now().year,
    })
    text_content = f"""Hola {usuario.name},

    Recibimos una solicitud para restablecer tu contraseña.

    Haz clic en el siguiente enlace para crear una nueva contraseña:
    {reset_link}

    Si no solicitaste este cambio, puedes ignorar este mensaje.

    Saludos,
    El equipo de Go4Surprise
    """

    try:
        email = EmailMultiAlternatives(subject, text_content, config('DEFAULT_FROM_EMAIL'), [user.email])
        email.attach_alternative(html_content, "text/html")
        email.send()
    except Exception as e:
        logger.error(f"Error al enviar email de recuperación: {str(e)}")    
    return Response({'message': 'Password reset link sent to email', 'reset_link': reset_link}, status=status.HTTP_200_OK)


@csrf_exempt
def password_reset_confirm(request, uidb64, token):
    try:
        # Decodificar UID como UUID
        uid = uuid.UUID(force_str(urlsafe_base64_decode(uidb64)))  
        usuario = get_object_or_404(Usuario, pk=uid)
        user = usuario.user

        # Validar el token
        if not custom_token_generator.check_token(user, token):
            return JsonResponse({'error': 'Invalid or expired token'}, status=400)

        if request.method == 'GET':
            # Valida el token
            return JsonResponse({'message': 'Token is valid, please enter your new password'}, status=200)

        if request.method == 'POST':
            # Cuando el frontend envíe una nueva contraseña, procesamos el cambio
            data = json.loads(request.body)
            new_password = data.get('password')
            confirm_password = data.get('confirm_password')

            if not new_password or not confirm_password:
                return JsonResponse({'error': 'Both password fields are required'}, status=400)
            
            if new_password != confirm_password:
                return JsonResponse({'error': 'Passwords do not match'}, status=400)

            # Cambiar la contraseña
            user.set_password(new_password)
            user.save()
            return JsonResponse({'message': 'Password reset successful'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_username_by_id(request, user_id):
    """
    Retrieve the username based on the user ID.
    """
    try:
        user = get_object_or_404(Usuario, id=user_id)
        return Response({"username": user.username}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
