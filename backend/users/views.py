from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .tokens_custom import custom_token_generator

from .serializers import RegisterSerializer, LoginSerializer, PreferencesSerializer, UserSerializer, UserUpdateSerializer
from .models import Preferences
from django.contrib.auth.models import User
from .models import Usuario
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from decouple import config
from django.views.decorators.csrf import csrf_exempt

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
        serializer.save()
        return Response({"message": "Usuario correctamente creado"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method="post",
    request_body=LoginSerializer,
    responses={
        200: openapi.Response("Login exitoso"),
        400: openapi.Response("Credenciales inválidas"),
    },
    operation_summary="Inicio de sesión",
    operation_description="Autentica al usuario y devuelve un token JWT.",
)
@api_view(['POST'])
def login_user(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Devuelve la información del usuario autenticado"""
    user = request.user.usuario  # Asegúrate de que `usuario` es la relación correcta
    serializer = UserSerializer(user)  
    return Response(serializer.data, status=status.HTTP_200_OK)


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
    """Elimina la cuenta del usuario autenticado"""
    try:
        user = request.user
        usuario = user.usuario  # Relación con el modelo Usuario

        print(f"Eliminando usuario {usuario.id} - {user.username}")  # Para debug

        usuario.delete()
        user.delete()

        return Response({"message": "Cuenta eliminada correctamente"}, status=status.HTTP_204_NO_CONTENT)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error al eliminar cuenta: {str(e)}")  # Para debug
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

    user = get_object_or_404(Usuario, email=email)
    
    # Generate reset link
    uidb64 = urlsafe_base64_encode(force_bytes(user.id))
    token = custom_token_generator.make_token(user)
    frontend_url = request.data.get('BASE_URL')
    reset_link = f"{frontend_url}/users/reset/{uidb64}/{token}/"

    # Send email
    send_mail(
        subject="Password Reset Request",
        message=f"Click the link below to reset your password:\n{reset_link}",
        from_email=config('DEFAULT_FROM_EMAIL'),
        recipient_list=[user.email],
    )
    return Response({'message': 'Password reset link sent to email'}, status=status.HTTP_200_OK)

@csrf_exempt
def password_reset_confirm(request, uidb64, token):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_password = data.get('password')

            if not new_password:
                return JsonResponse({'error': 'New password is required'}, status=400)

            # Decode user ID
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_object_or_404(User, pk=uid)

            # Validate token
            if not custom_token_generator.check_token(user, token):
                return JsonResponse({'error': 'Invalid or expired token'}, status=400)

            # Set new password
            user.set_password(new_password)
            user.save()

            return JsonResponse({'message': 'Password reset successful'})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)