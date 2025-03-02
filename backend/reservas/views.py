from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser

from reservas.models import reserva
from reservas.serializers import CrearReservaSerializer, ReservaSerializer

@swagger_auto_schema(
    method='post',
    request_body=CrearReservaSerializer,
    operation_id="crear_reserva",
    operation_description="Crear una reserva",
    responses={
        201: "Created",
        400: "Bad Request",
        500: "Internal Server Error"
    },
    tags=['Reservas']
)
@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser, JSONParser])
def crear_reserva(request):
    """
    Crea una reserva
    """
    try:
      serializer = CrearReservaSerializer(data=request.data)
      if serializer.is_valid():
          serializer.save()
          return Response(serializer.data, status=status.HTTP_201_CREATED)
      
      return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@swagger_auto_schema(
    method='get',
    operation_id="obtener_reserva",
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
    tags=['Reservas']
)
@api_view(['GET'])
def obtener_reserva(request, id):
    """
    Obtiene una reserva por su ID
    """
    try:
      reserva_obj = get_object_or_404(reserva, id=id)
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


