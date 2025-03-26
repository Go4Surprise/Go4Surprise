from django.http import Http404
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

from go4surprise import settings
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import Usuario
from bookings.models import Booking, Experience
from bookings.serializers import CrearReservaSerializer, ReservaSerializer, AdminBookingUpdateSerializer, AdminBookingSerializer
from django.views.decorators.csrf import csrf_exempt
import stripe

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
@permission_classes([])
def obtener_reserva(request, id):
    """
    Obtiene una reserva por su ID
    """
    try:
        reserva_obj = get_object_or_404(Booking, id=id)
        serializer = ReservaSerializer(reserva_obj)  # Usa el serializador actualizado
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
    Obtiene las reservas de un usuario
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

@swagger_auto_schema(
    method='put',
    operation_id="update_booking_status",
    operation_description="Actualizar el estado de una reserva",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'status': openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Nuevo estado de la reserva ('PENDING', 'CONFIRMED', 'CANCELLED')",
                enum=['PENDING', 'CONFIRMED', 'CANCELLED']
            ),
        },
        required=['status'],
    ),
    responses={
        200: "OK",
        400: "Bad Request",
        404: "Not Found",
        500: "Internal Server Error"
    },
    tags=['Booking']
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_estado_reserva(request, id):
    """
    Actualiza el estado de una reserva específica
    """
    try:
        reserva = get_object_or_404(Booking, id=id)
        nuevo_estado = request.data.get('status')

        if nuevo_estado not in ['PENDING', 'CONFIRMED', 'CANCELLED']:
            return Response(
                {"error": "Estado inválido. Debe ser 'PENDING', 'CONFIRMED' o 'CANCELLED'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reserva.status = nuevo_estado
        reserva.save()
        return Response({"message": "Estado actualizado correctamente."}, status=status.HTTP_200_OK)
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
    
    experience_id = request.data.get('experience_id', None)
    if experience_id:
        try:
            experience = Experience.objects.get(id=experience_id)
            booking.experience = experience
        except Experience.DoesNotExist:
            return Response({"error": "Experiencia no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = AdminBookingUpdateSerializer(booking, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(AdminBookingSerializer(booking).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([])
def iniciar_pago(request, booking_id):
    try:
        booking = get_object_or_404(Booking, id=booking_id)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Reserva {booking.experience.location}",
                    },
                    'unit_amount': int(booking.total_price * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://localhost:8081/HomeScreen",
            cancel_url="http://localhost:8081/BookingDetails",
            metadata={
                'booking_id': str(booking.id),
            },
        )

        return Response({'checkout_url': session.url}, status=status.HTTP_200_OK)

    except Booking.DoesNotExist:
        return Response({'error': 'Reserva no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_ENDPOINT_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            booking_id = session.get('metadata', {}).get('booking_id')

            if booking_id:
                booking = Booking.objects.get(id=booking_id)
                booking.status = "CONFIRMED"
                booking.save()

    except stripe.error.SignatureVerificationError:
        return JsonResponse({'error': 'Webhook signature verification failed'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'status': 'success'}, status=200)
