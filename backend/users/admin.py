from django.contrib import admin
from .models import Usuario
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import AdminUserSerializer, AdminUserUpdateSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.permissions import BasePermission

admin.site.register(Usuario)

class IsAdminUser(BasePermission):
    """
    Verifica si el usuario es un administrador
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_superuser or request.user.is_staff)

@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response("Lista de usuarios obtenida correctamente", AdminUserSerializer(many=True)),
        403: openapi.Response("Acceso denegado - Solo administradores"),
    },
    operation_summary="Listar todos los usuarios",
    operation_description="Devuelve una lista de todos los usuarios del sistema (solo para administradores)",
)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_list(request):
    """
    List all users (admin only)
    """
    users = User.objects.all().order_by('-date_joined')
    serializer = AdminUserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)

@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response("Usuario obtenido correctamente", AdminUserSerializer()),
        403: openapi.Response("Acceso denegado - Solo administradores"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Obtener detalle de usuario",
    operation_description="Devuelve la información de un usuario específico (solo para administradores)",
)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, pk):
    """
    Retrieve a specific user (admin only)
    """
    try:
        user = User.objects.get(pk=pk)
        serializer = AdminUserSerializer(user, context={'request': request})
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

@swagger_auto_schema(
    method="put",
    request_body=AdminUserUpdateSerializer,
    responses={
        200: openapi.Response("Usuario actualizado correctamente", AdminUserSerializer()),
        400: openapi.Response("Datos inválidos"),
        403: openapi.Response("Acceso denegado - Solo administradores"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Actualizar usuario",
    operation_description="Actualiza la información de un usuario específico (solo para administradores)",
)
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_user_update(request, pk):
    """
    Update a user (admin only)
    """
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(AdminUserSerializer(user, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method="delete",
    responses={
        204: openapi.Response("Usuario eliminado correctamente"),
        403: openapi.Response("Acceso denegado - Solo administradores"),
        404: openapi.Response("Usuario no encontrado"),
    },
    operation_summary="Eliminar usuario",
    operation_description="Elimina un usuario específico (solo para administradores)",
)
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_user_delete(request, pk):
    """
    Delete a user (admin only)
    """
    try:
        user = User.objects.get(pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)