from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from .serializers import RegisterSerializer, LoginSerializer, PreferencesSerializer, UserSerializer
from .models import Preferences


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

    for category in ['music', 'culture', 'sports', 'gastronomy', 'nightlife', 'adventure']:
        if category in data and isinstance(data[category], list):  
            preferences.__setattr__(category, data[category])

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