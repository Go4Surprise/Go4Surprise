from django.http import Http404
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

from go4surprise import settings
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from go4surprise.settings import DEBUG, GS_PUNTERO

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.models import Usuario
from bookings.models import Booking, Experience
from bookings.serializers import CrearReservaSerializer, ReservaSerializer, AdminBookingUpdateSerializer, AdminBookingSerializer
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from decouple import config
import logging
import stripe
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from datetime import datetime


logger = logging.getLogger(__name__)

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

            # Enviar correo electrónico al usuario
            usuario = reserva_obj.user
            from_email = config('DEFAULT_FROM_EMAIL')
            to = [usuario.email]
            subject = "Confirmación de reserva - Go4Surprise"
            context = {
                "usuario": usuario,
                "subject": subject,
                "year": datetime.now().year,
                "experience_date": reserva_obj.experience_date,
                "location": reserva_obj.experience.location,
                "total_price": reserva_obj.total_price,
            }

            text_content = f"""
            Hola {usuario.name},
            Gracias por reservar con nosotros. Tu reserva ha sido confirmada y estamos emocionados de sorprenderte.
            Aquí tienes los detalles de tu reserva:
            - Fecha de experiencia: {reserva_obj.experience_date}
            - Ubicación: {reserva_obj.experience.location}
            - Precio total: {reserva_obj.total_price} EUR
            Si tienes alguna pregunta, no dudes en contactarnos.
            ¡Gracias por elegirnos y esperamos sorprenderte pronto!
            Atentamente,
            El equipo de Go4Surprise
            """
        
            html_content = render_to_string("emails/confirmacion.html", context)

            msg = EmailMultiAlternatives(subject, text_content, from_email, to)
            msg.attach_alternative(html_content, "text/html")

            try:
                msg.send()
            except Exception as e:
                logger.error(f"Error al enviar email de cancelación: {str(e)}")
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

        base_url = "http://localhost:8081" if DEBUG else f"https://{GS_PUNTERO}-go4-frontend-dot-ispp-2425-g10.ew.r.appspot.com"
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card', 'paypal'],
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
            success_url=f"{base_url}/HomeScreen",
            cancel_url=f"{base_url}/BookingDetails",
            metadata={
                'booking_id': str(booking.id),
            },
        )

        return Response({'checkout_url': session.url, 'booking.payment_intent_id': booking.payment_intent_id}, status=status.HTTP_200_OK)

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
            payment_intent_id = session.get('payment_intent')

            if booking_id:
                booking = Booking.objects.get(id=booking_id)
                booking.status = "CONFIRMED"
                booking.payment_intent_id = payment_intent_id
                booking.save()

    except stripe.error.SignatureVerificationError:
        return JsonResponse({'error': 'Webhook signature verification failed'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'status': 'success'}, status=200)

@swagger_auto_schema(
method='put',  # Changed from 'patch' to 'put'
    operation_id="cancel_booking",
    operation_description="Cancelar una reserva",
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

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def cancelar_reserva(request, id):
    """
    Cambia el estado de una reserva a 'cancelled'
    """
    try:
        print(f"Received request to cancel booking with ID: {id}")  # Debugging log
        reserva = get_object_or_404(Booking, id=id)

        if reserva.status != "CANCELLED":
            reserva.status = "CANCELLED"
            reserva.save()
            print(f"Booking {id} status updated to 'CANCELLED'")
            print(reserva.payment_intent_id)  # Debugging log

            # Realizar el reembolso si hay un pago asociado
            if reserva.payment_intent_id:
                try:
                    payment_intent = stripe.PaymentIntent.retrieve(
                    reserva.payment_intent_id,
                    expand=["charges"]  # 👈 ¡IMPORTANTE!
                    )
                    charges = payment_intent['charges']['data']

                    if charges:
                        charge_id = charges[0]['id']
                        refund = stripe.Refund.create(charge=charge_id)
                        print(f"✅ Reembolso creado: {refund.id}")
                    else:
                        print("❌ No se encontraron cargos asociados para el reembolso")

                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print(f"❌ Error al procesar el reembolso: {e}")

            usuario = reserva.user
            subject = "Confirmación de cancelación y reembolso - Go4Surprise"
            from_email = config('DEFAULT_FROM_EMAIL')
            to = [usuario.email]

            context = {
                "usuario": usuario,
                "subject": subject,
                "year": datetime.now().year,
            }

            text_content = f"""
            Hola {usuario.name},
        
            Hemos recibido tu solicitud de cancelación para la experiencia sorpresa. Lamentamos que no puedas disfrutarla esta vez. Te confirmamos que procederemos con el reembolso de tu pago de inmediato.

            Si tienes alguna pregunta, no dudes en contactarnos.

            ¡Gracias por elegirnos y esperamos sorprenderte pronto!
        
            Atentamente,
            El equipo de Go4Surprise
            """
        
            html_content = render_to_string("emails/cancelacion.html", context)

            msg = EmailMultiAlternatives(subject, text_content, from_email, to)
            msg.attach_alternative(html_content, "text/html")

            try:
                msg.send()
            except Exception as e:
                logger.error(f"Error al enviar email de cancelación: {str(e)}")


            return Response({"message": "Reserva cancelada exitosamente"}, status=status.HTTP_200_OK)    
        
        print(f"Booking {id} is already cancelled")  # Debugging log
        return Response({"message": "La reserva ya está cancelada"}, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        print(f"Booking with ID {id} not found")  # Debugging log
        return Response(
            {"error": "Reserva no encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error while cancelling booking {id}: {str(e)}")  # Debugging log
        return Response(
    {"error": f"Error del servidor: {str(e)}"},
    status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def notify_users_about_hint():
    """
    Notifica a los usuarios sobre la pista que se vuelve visible para sus reservas.
    """
    from bookings.models import Booking  # Importar aquí para evitar importaciones circulares

    # Obtener reservas donde la pista se vuelve visible (48 horas antes de la fecha de la experiencia)
    threshold_date = now().date() + timedelta(days=2)
    bookings = Booking.objects.filter(experience_date=threshold_date, status="CONFIRMED")

    for booking in bookings:
        # Verificar que la pista esté rellena, que la reserva esté confirmada y que el correo esté verificado
        if booking.experience and booking.experience.hint and booking.user.email_verified:
            subject = f"✨ ¡Tu pista para la experiencia Go4Surprise está lista! ✨"
            message = f"""
            Hola {booking.user.name},

            ¡Estamos emocionados de que tu experiencia con Go4Surprise esté a menos de 48 horas de distancia! 🎉

            Aquí tienes una pista exclusiva para tu aventura sorpresa:
            🕵️‍♂️ "{booking.experience.hint}" 🕵️‍♀️

            Detalles de tu reserva:
            📅 Fecha de la experiencia: {booking.experience_date}
            👥 Participantes: {booking.participants}
            📍 Ubicación: {booking.experience.location}

            Prepárate para vivir una experiencia inolvidable llena de sorpresas y emociones. Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.

            ¡Gracias por confiar en Go4Surprise para tus aventuras!

            🌟 Nos vemos pronto,
            El equipo de Go4Surprise
            """
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[booking.user.email],
                )
                print(f"Email enviado a {booking.user.email} para la reserva {booking.id}")
            except Exception as e:
                print(f"Error al enviar el email para la reserva {booking.id}: {str(e)}")
        else:
            print(f"Reserva {booking.id} no cumple con los requisitos para enviar el correo.")

def notify_users_about_experience_details():
    """
    Notifica a los usuarios con todos los detalles de la experiencia y la pista 24 horas antes de la fecha de la experiencia.
    """
    from bookings.models import Booking  # Importar aquí para evitar importaciones circulares

    # Obtener reservas donde la experiencia está a 24 horas de distancia
    threshold_date = now().date() + timedelta(days=1)
    bookings = Booking.objects.filter(experience_date=threshold_date, status="CONFIRMED")

    for booking in bookings:
        # Verificar todos los detalles necesarios para enviar el correo
        if booking.experience.title and booking.experience.description and booking.experience.link and booking.experience and booking.experience.hint and booking.user.email_verified:
            subject = f"✨ Detalles de tu experiencia Go4Surprise ✨"
            message = f"""
            Hola {booking.user.name},

            ¡Tu experiencia con Go4Surprise está a menos de 24 horas de distancia! 🎉 Aquí tienes todos los detalles que necesitas:

            Título: {booking.experience.title}
            Descripción: {booking.experience.description}
            Enlace: {booking.experience.link}

            Detalles de tu experiencia:
            🕵️‍♂️ Pista: "{booking.experience.hint}"
            📅 Fecha: {booking.experience_date}
            ⏰ Horario preferido: {booking.experience.time_preference}
            📍 Ubicación: {booking.experience.location}
            💰 Precio total: {booking.total_price}€
            👥 Participantes: {booking.participants}

            ¡Prepárate para disfrutar de una experiencia inolvidable llena de sorpresas y emociones! Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.

            🌟 Nos vemos pronto,
            El equipo de Go4Surprise
            """
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[booking.user.email],
                )
                print(f"Email enviado a {booking.user.email} para la reserva {booking.id}")
            except Exception as e:
                print(f"Error al enviar el email para la reserva {booking.id}: {str(e)}")
        else:
            print(f"Reserva {booking.id} no cumple con los requisitos para enviar el correo.")


@swagger_auto_schema(
    method='get',
    operation_id="send_scheduled_notifications",
    operation_description="Enviar notificaciones programadas",
    responses={
        200: "Notifications processed successfully",
        401: "Unauthorized - Invalid token",
        500: "Internal Server Error"
    },
    tags=['Notifications']
)
@api_view(['GET'])
@csrf_exempt
def send_scheduled_notifications(request):
    """
    Endpoint to be called by Google Cloud Scheduler to trigger sending all scheduled notifications.
    Calls both notify_users_about_hint() and notify_users_about_experience_details().
    """
    try:
        notify_users_about_hint()
        notify_users_about_experience_details()
        
        return JsonResponse({
            "status": "success",
            "message": "All scheduled notifications have been processed"
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error processing notifications: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_booking_list(request):
    """
    Retrieve all bookings for admin view.
    """
    try:
        bookings = Booking.objects.select_related('user').all()  # Use select_related to fetch related user data
        serializer = AdminBookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"Error retrieving bookings: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
