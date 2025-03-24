from django.contrib import admin
from bookings.models import Booking
from experiences.models import Experience
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from bookings.serializers import AdminBookingSerializer, AdminBookingUpdateSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.permissions import BasePermission
from users.admin import IsAdminUser

# Register your models here.
admin.site.register(Booking)

@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response("Lista de reservas obtenida correctamente", AdminBookingSerializer(many=True)),
        403: openapi.Response("Acceso denegado - Solo administradores"),
    },
    operation_summary="Listar todas las reservas",
    operation_description="Devuelve una lista de todas las reservas del sistema (solo para administradores)",
)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_booking_list(request):
    """
    List all bookings (admin only)
    """
    bookings = Booking.objects.all().order_by('-experience_date')
    serializer = AdminBookingSerializer(bookings, many=True, context={'request': request})
    return Response(serializer.data)


@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response("Detalles de la reserva obtenidos correctamente", AdminBookingSerializer()),
        404: openapi.Response("Reserva no encontrada"),
    },
    operation_summary="Obtener detalles de una reserva",
    operation_description="Devuelve los detalles de una reserva específica (solo para administradores)",
)
@swagger_auto_schema(
    method="put",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'experience_id': openapi.Schema(type=openapi.TYPE_STRING, format='uuid', description="ID de la experiencia"),
            'hint': openapi.Schema(type=openapi.TYPE_STRING, description="Pista para la experiencia"),
        },
        required=['experience_id'],
    ),
    responses={
        200: openapi.Response("Reserva actualizada correctamente", AdminBookingSerializer()),
        400: openapi.Response("Datos inválidos"),
        404: openapi.Response("Reserva o experiencia no encontrada"),
    },
    operation_summary="Actualizar experiencia y pista de una reserva",
    operation_description="Permite asignar una experiencia existente y actualizar la pista de una reserva específica (solo para administradores)",
)
@api_view(['GET', 'PUT'])
@permission_classes([IsAdminUser])
def admin_booking_detail(request, pk):
    """
    Retrieve or update a specific booking (admin only)
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"error": "Reserva no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AdminBookingSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'PUT':
        experience_id = request.data.get('experience_id')
        hint = request.data.get('hint')

        try:
            experience = Experience.objects.get(id=experience_id)
            booking.experience = experience
            if hint:
                booking.experience.hint = hint
                booking.experience.save()
            booking.save()
            return Response(AdminBookingSerializer(booking, context={'request': request}).data)
        except Experience.DoesNotExist:
            return Response({"error": "Experiencia no encontrada"}, status=status.HTTP_404_NOT_FOUND)


@swagger_auto_schema(
    method="put",
    request_body=AdminBookingUpdateSerializer,
    responses={
        200: openapi.Response("Reserva actualizada correctamente", AdminBookingSerializer()),
        400: openapi.Response("Datos inválidos"),
        403: openapi.Response("Acceso denegado - Solo administradores"),
        404: openapi.Response("Reserva no encontrada"),
    },
    operation_summary="Actualizar reserva",
    operation_description="Actualiza la información de una reserva específica (solo para administradores)",
)
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_booking_update(request, pk):
    """
    Update a booking (admin only)
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"error": "Reserva no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    
    hint = request.data.get('hint', None)
    serializer = AdminBookingUpdateSerializer(booking, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        if hint is not None:
            booking.experience.hint = hint
            booking.experience.save()
        
        return Response(AdminBookingSerializer(booking, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method="delete",
    responses={
        204: openapi.Response("Reserva eliminada correctamente"),
        403: openapi.Response("Acceso denegado - Solo administradores"),
        404: openapi.Response("Reserva no encontrada"),
    },
    operation_summary="Eliminar reserva",
    operation_description="Elimina una reserva específica (solo para administradores)",
)
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_booking_delete(request, pk):
    """
    Delete a booking (admin only)
    """
    try:
        booking = Booking.objects.get(pk=pk)
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Booking.DoesNotExist:
        return Response({"error": "Reserva no encontrada"}, status=status.HTTP_404_NOT_FOUND)