from django.http import Http404
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import Usuario
from bookings.models import Booking
from bookings.serializers import CrearReservaSerializer, ReservaSerializer

@swagger_auto_schema(
    method='post',
    request_body=CrearReservaSerializer,
    operation_id="create_booking",
    operation_description="Crear una reserva",
    responses={
        201: ReservaSerializer,
        400: "Bad Request",
        500: "Internal Server Error"
    },
    tags=['Booking']
)
@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser, JSONParser])
@permission_classes([IsAuthenticated])
def crear_reserva(request):
    """
    Crea una reserva
    """
    try:
      serializer = CrearReservaSerializer(data=request.data)
      if serializer.is_valid():
            reserva_obj = serializer.save()
            response_serializer = ReservaSerializer(reserva_obj)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
      
      return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@swagger_auto_schema(
    method='get',
    operation_id="get_booking",
    operation_description="Obtener detalles de una reserva específica",
    manual_parameters=[
        openapi.Parameter(
            'id', 
            openapi.IN_PATH, 
            description="ID de la reserva (UUID)", 
            type=openapi.TYPE_STRING,
            format='uuid',
            required=True
        ),
    ],
    responses={
        200: "OK",
        404: "Not Found",
        500: "Internal Server Error"
    },
    tags=['Booking']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_reserva(request, id):
    """
    Obtiene una reserva por su ID
    """
    try:
      reserva_obj = get_object_or_404(Booking, id=id)
      serializer = ReservaSerializer(reserva_obj)
      return Response(serializer.data, status=status.HTTP_200_OK)
    except Http404:
        return Response(
            {"error": "Reserva no encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    operation_id="get_user_bookings",
    operation_description="Obtener todas las reservas de un usuario",
    manual_parameters=[
        openapi.Parameter(
            'user_id', 
            openapi.IN_PATH, 
            description="ID del usuario (UUID)", 
            type=openapi.TYPE_STRING,
            format='uuid',
            required=True
        ),
    ],
    responses={
        200: "OK",
        404: "Not Found",
        500: "Internal Server Error"
    },
    tags=['Booking']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_reservas_usuario(request, user_id):
    """
    Obtiene una reserva por su ID
    """
    try:
      usuario = get_object_or_404(Usuario, id=user_id)
      reservas = Booking.objects.filter(user=usuario)
      serializer = ReservaSerializer(reservas, many=True)
      return Response(serializer.data, status=status.HTTP_200_OK)
    except Http404:
        return Response(
            {"error": "Usuario no encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from datetime import date

@swagger_auto_schema(
    method='get',
    operation_id="get_user_past_bookings",
    operation_description="Obtener todas las reservas pasadas de un usuario",
    manual_parameters=[
        openapi.Parameter(
            'user_id', 
            openapi.IN_PATH, 
            description="ID del usuario (UUID)", 
            type=openapi.TYPE_STRING,
            format='uuid',
            required=True
        ),
    ],
    responses={
        200: "OK",
        404: "Not Found",
        500: "Internal Server Error"
    },
    tags=['Booking']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_reservas_pasadas_usuario(request, user_id):
    """
    Obtiene todas las reservas pasadas de un usuario autenticado.
    """
    try:
        usuario = get_object_or_404(Usuario, id=user_id)
        hoy = date.today()
        
        # Filtra las reservas donde experience_date ya pasó
        reservas_pasadas = Booking.objects.filter(user=usuario, experience_date__lt=hoy).order_by('-experience_date')
        
        serializer = ReservaSerializer(reservas_pasadas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Http404:
        return Response(
            {"error": "Usuario no encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
