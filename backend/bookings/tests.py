import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Usuario
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from datetime import date
from bookings.models import Booking
from experiences.models import Experience
from datetime import timedelta
from unittest.mock import patch
from django.urls import reverse 
import stripe
from bookings.views import notify_users_about_hint, notify_users_about_experience_details
from django.utils.timezone import now


@pytest.fixture
def api_client_with_token(create_user):
    client = APIClient()
    refresh = RefreshToken.for_user(create_user.user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client

@pytest.fixture
def create_user(transactional_db):
    # Limpiar usuario existente antes de crear uno nuevo
    User.objects.filter(username='testuser').delete()
    user = User.objects.create_user(username='testuser', password='testpass')
    Usuario.objects.filter(user=user).delete()
    return Usuario.objects.create(user=user, name='Test', surname='User', email='testuser@example.com')

@pytest.fixture
def create_experience():
    return Experience.objects.create(
        title='Experiencia Test',
        description='Una experiencia de prueba',
        price=50.0,
        location='Madrid',
        time_preference='MORNING',
        categories=["ADVENTURE", "CULTURE"],  
        notas_adicionales='Preferencia en zona centro'
    )

@pytest.fixture
def create_booking(create_user, create_experience):
    return Booking.objects.create(
        user=create_user,
        experience=create_experience,
        experience_date=date(2025, 4, 1),
        booking_date=date.today(),
        cancellable=True,
        status="PENDING",
        participants=2,
        price=50.0,
        total_price=100.0,
        payment_intent_id="pi_test_123" 

    )
@pytest.fixture
def create_past_booking(create_user,create_experience):
    # Crear una reserva pasada (fecha anterior a hoy)
    past_date = date.today() - timedelta(days=5)
    return Booking.objects.create(
        user=create_user,
        participants=2,
        price=50.0,
        total_price=100.0,
        experience_date=past_date,
        experience=create_experience,
        booking_date=past_date - timedelta(days=2),
        cancellable=False,
        status='CONFIRMED'
    )

@pytest.fixture
def create_confirmed_booking(create_user):
    # Crear una experiencia y una reserva confirmada
    experience = Experience.objects.create(
       title='Experiencia Test',
        description='Una experiencia de prueba',
        price=50.0,
        location='Madrid',
        time_preference='MORNING',
        categories=["ADVENTURE", "CULTURE"],  
        notas_adicionales='Preferencia en zona centro'
    )
    booking = Booking.objects.create(
        user=create_user,
        experience=experience,
        experience_date=now().date() + timedelta(days=2),  # Para la notificación de pista
        booking_date=date.today(),
        price = 50.0,
        status="CONFIRMED",
        participants=2,
        cancellable=True,
        total_price=100.0
    )
    return booking

@pytest.fixture
def create_experience_details_booking(create_user):
    # Crear una experiencia y una reserva confirmada (24 horas antes)
    experience = Experience.objects.create(
        title='Aventura Extrema',
        description='Escalada en roca al amanecer',
        hint='Lleva zapatos cómodos',
        location='Barcelona',
        time_preference='AFTERNOON',
        price=100.0,
        link="http://aventuraextrema.com"
    )
    booking = Booking.objects.create(
        user=create_user,
        experience=experience,
        experience_date=now().date() + timedelta(days=1),  # Para la notificación de detalles
        booking_date=date.today(),
        cancellable=True,
        status="CONFIRMED",
        price = 100.0,
        participants=3,
        total_price=300.0
    )
    return booking

@pytest.fixture
def create_admin_user(transactional_db):
    # Eliminar el usuario existente antes de crear uno nuevo
    User.objects.filter(username='adminuser').delete()
    Usuario.objects.filter(email='adminuser@example.com').delete()

    # Crear el usuario administrador o recuperarlo si ya existe
    user, created = User.objects.get_or_create(
        username='adminuser',
        defaults={'password': 'adminpass', 'is_superuser': True, 'is_staff': True}
    )
    
    # Crear el perfil de usuario si no existe
    admin_user, created = Usuario.objects.get_or_create(
        user=user,
        defaults={'name': 'Admin', 'surname': 'User', 'email': 'adminuser@example.com'}
    )
    return admin_user

@pytest.fixture
def api_client_with_admin_token(create_admin_user):
    client = APIClient()
    refresh = RefreshToken.for_user(create_admin_user.user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client

@pytest.mark.django_db
class TestCrearReserva:
# ------------------TESTS DE CREACIÓN DE RESERVA ---------------------------------------------------------------------
    def test_crear_reserva_happy_path(self, api_client_with_token, create_user):
        data = {
            'nombre': 'Reserva Test',
            'user': str(create_user.id),
            'experience_date': '2025-04-01',
            'status': 'PENDING',
            'participants': 2,
            'price': 50.0,
            'location': 'Madrid',
            'time_preference': 'MORNING',
            'categories': ["ADVENTURE", "CULTURE"],  
            'notas_adicionales': 'Preferencia en zona centro'
        }

        # Realiza la solicitud con formato JSON
        response = api_client_with_token.post('/bookings/crear-reserva/', data=data, format='json')

        # Verifica que el estado sea 201 (Creado)
        print(f"Response data: {response.data}")  # Para ver el contenido de la respuesta en caso de error
        assert response.status_code == status.HTTP_201_CREATED, f"Error: {response.data}"
        assert 'id' in response.data

    def test_crear_reserva_bad_request(self, api_client_with_token, create_user):
        data = {}  # Datos incompletos
        response = api_client_with_token.post('/bookings/crear-reserva/', data=data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Verificar campos específicos que fallaron
        assert 'participants' in response.data
        assert 'price' in response.data
        assert 'time_preference' in response.data
        

# ------------------TESTS DE OBTENCIÓN DE RESERVA ---------------------------------------------------------------------
    def test_get_booking_happy_path(self, api_client_with_token, create_booking):
        """
        Test para obtener una reserva existente
        """
        response = api_client_with_token.get(f'/bookings/obtener-reserva/{create_booking.id}/')

        # Verificación de respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data
        assert response.data['id'] == str(create_booking.id)
        assert response.data['status'] == 'PENDING'
        assert response.data['participants'] == 2
        assert response.data['total_price'] == 100.0

    def test_get_booking_not_found(self, api_client_with_token):
        """
        Test para obtener una reserva con un ID inexistente
        """
        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/obtener-reserva/{fake_id}/')

        # Verificación de reserva no encontrada
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == 'Reserva no encontrada'

    def test_get_booking_server_error(self, api_client_with_token, monkeypatch):
        """
        Test para simular un error en el servidor
        """
        # Mockear la función get_object_or_404 para que genere una excepción
        def mock_get_object_or_404(*args, **kwargs):
            raise Exception("Error inesperado")

        # Usamos monkeypatch para reemplazar la función
        monkeypatch.setattr("bookings.views.get_object_or_404", mock_get_object_or_404)
        
        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/obtener-reserva/{fake_id}/')

        # Verificación de error del servidor
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == 'Error del servidor: Error inesperado'

# ------------------TESTS DE OBTENCIÓN DE TODAS LAS RESERVAS DE UN USUARIO ---------------------------------------------------------------------
    def test_get_user_bookings_happy_path(self, api_client_with_token, create_user, create_booking):
        """
        Test para obtener todas las reservas de un usuario existente
        """
        response = api_client_with_token.get(f'/bookings/users/{create_user.id}/')

        # Verificación de respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0  # Hay al menos una reserva

        # Verificar los campos de la reserva
        reserva = response.data[0]
        assert 'id' in reserva
        assert reserva['id'] == str(create_booking.id)
        assert reserva['status'] == 'PENDING'
        assert reserva['participants'] == 2
        assert reserva['total_price'] == 100.0

    def test_get_user_bookings_user_not_found(self, api_client_with_token):
        """
        Test para obtener reservas con un ID de usuario inexistente
        """
        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/users/{fake_id}/')

        # Verificación de usuario no encontrado
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == 'Usuario no encontrado'

    def test_get_user_bookings_server_error(self, api_client_with_token, monkeypatch):
        """
        Test para simular un error en el servidor al obtener reservas de usuario
        """
        # Mock de la función get_object_or_404 para provocar un error
        def mock_get_object_or_404(*args, **kwargs):
            raise Exception("Error inesperado al obtener usuario")

        # Usamos monkeypatch para reemplazar la función
        monkeypatch.setattr("bookings.views.get_object_or_404", mock_get_object_or_404)

        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/users/{fake_id}/')

        # Verificación de error del servidor
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == 'Error del servidor: Error inesperado al obtener usuario'

# ------------------TESTS DE OBTENCIÓN DE TODAS LAS RESERVAS PASADAS DE UN USUARIO ---------------------------------------------------------------------
    def test_get_user_past_bookings_happy_path(self, api_client_with_token, create_user, create_past_booking):
        """
        Test para obtener todas las reservas pasadas de un usuario existente
        """
        response = api_client_with_token.get(f'/bookings/user_past_bookings/{create_user.id}/')

        # Verificación de respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0  # Hay al menos una reserva

        # Verificar los campos de la reserva
        reserva = response.data[0]
        assert 'id' in reserva
        assert reserva['id'] == str(create_past_booking.id)
        assert reserva['status'] == 'CONFIRMED'
        assert reserva['participants'] == 2
        assert reserva['total_price'] == 100.0

    def test_get_user_past_bookings_user_not_found(self, api_client_with_token):
        """
        Test para obtener reservas pasadas con un ID de usuario inexistente
        """
        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/user_past_bookings/{fake_id}/')

        # Verificación de usuario no encontrado
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == 'Usuario no encontrado'

    def test_get_user_past_bookings_server_error(self, api_client_with_token, monkeypatch):
        """
        Test para simular un error en el servidor al obtener reservas pasadas de usuario
        """
        # Mock de la función get_object_or_404 para provocar un error
        def mock_get_object_or_404(*args, **kwargs):
            raise Exception("Error inesperado al obtener usuario")

        # Usamos monkeypatch para reemplazar la función
        monkeypatch.setattr("bookings.views.get_object_or_404", mock_get_object_or_404)

        fake_id = uuid.uuid4()
        response = api_client_with_token.get(f'/bookings/user_past_bookings/{fake_id}/')

        # Verificación de error del servidor
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == 'Error del servidor: Error inesperado al obtener usuario'

# ------------------TESTS DE ACTUALIZACIÓN DEL ESTADO DE RESERVA ---------------------------------------------------------------------
    
    def test_actualizar_estado_happy_path(self, api_client_with_token, create_booking):
        """
        Test para actualizar el estado de una reserva existente
        """
        data = {"status": "CONFIRMED"}
        response = api_client_with_token.put(f'/bookings/admin/update-status/{create_booking.id}/', data=data, format='json')

        # Verificación de respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert response.data['message'] == "Estado actualizado correctamente."

        # Verificar que el estado se actualizó en la base de datos
        create_booking.refresh_from_db()
        assert create_booking.status == "CONFIRMED"

    def test_actualizar_estado_reserva_no_encontrada(self, api_client_with_token):
        """
        Test para actualizar el estado de una reserva no existente
        """
        fake_id = uuid.uuid4()
        data = {"status": "CONFIRMED"}
        response = api_client_with_token.put(f'/bookings/admin/update-status/{fake_id}/', data=data, format='json')

        # Verificación de reserva no encontrada
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == "Reserva no encontrada"

    def test_actualizar_estado_invalido(self, api_client_with_token, create_booking):
        """
        Test para actualizar el estado con un valor no permitido
        """
        data = {"status": "INVALID_STATUS"}
        response = api_client_with_token.put(f'/bookings/admin/update-status/{create_booking.id}/', data=data, format='json')

        # Verificación de error por estado inválido
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error'] == "Estado inválido. Debe ser 'PENDING', 'CONFIRMED' o 'CANCELLED'."

    def test_actualizar_estado_server_error(self, api_client_with_token, create_booking, monkeypatch):
        """
        Test para simular un error en el servidor al actualizar el estado de una reserva
        """
        # Mock para provocar un error del servidor
        def mock_save(*args, **kwargs):
            raise Exception("Error inesperado al actualizar el estado")

        # Usamos monkeypatch para reemplazar el método save
        monkeypatch.setattr(Booking, "save", mock_save)

        data = {"status": "CONFIRMED"}
        response = api_client_with_token.put(f'/bookings/admin/update-status/{create_booking.id}/', data=data, format='json')

        # Verificación de error del servidor
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == "Error del servidor: Error inesperado al actualizar el estado"

# ------------------TESTS DE ACTUALIZACIÓN DE RESERVA ADMIN ---------------------------------------------------------------------
    
    def test_admin_booking_update_happy_path(self, api_client_with_admin_token, create_booking, create_experience):
        """
        Test para actualizar una reserva existente (Ruta Feliz)
        """
        data = {
            'participants': 3,
            'price': 150.0,
            'experience_id': str(create_experience.id)
        }
        response = api_client_with_admin_token.put(f'/bookings/admin/update/{create_booking.id}/', data=data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['participants'] == 3
        assert response.data['price'] == 150.0
        assert response.data['experience']['id'] == str(create_experience.id)

    def test_admin_booking_update_not_found(self, api_client_with_admin_token):
        """
        Test para reserva no encontrada
        """
        fake_id = uuid.uuid4()
        data = {'participants': 3}
        response = api_client_with_admin_token.put(f'/bookings/admin/update/{fake_id}/', data=data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data['error'] == "Reserva no encontrada"

    def test_admin_booking_update_experience_not_found(self, api_client_with_admin_token, create_booking):
        """
        Test para experiencia no encontrada
        """
        fake_experience_id = uuid.uuid4()
        data = {'experience_id': str(fake_experience_id)}
        response = api_client_with_admin_token.put(f'/bookings/admin/update/{create_booking.id}/', data=data, format='json')

        # Verificar que el código de estado sea 400
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Verificar que el mensaje de error esté dentro del campo 'experience_id'
        assert 'experience_id' in response.data
        assert response.data['experience_id'][0] == "Experiencia no encontrada."


    def test_admin_booking_update_invalid_data(self, api_client_with_admin_token, create_booking):
        """
        Test para datos inválidos
        """
        data = {'participants': -1}  # Número de participantes inválido
        response = api_client_with_admin_token.put(f'/bookings/admin/update/{create_booking.id}/', data=data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'participants' in response.data
        assert response.data['participants'][0] == "El número de participantes debe ser mayor a cero."


    def test_admin_booking_update_permission_denied(self, api_client_with_token, create_booking):
        """
        Test para permiso denegado (usuario no admin)
        """
        data = {'participants': 3}
        response = api_client_with_token.put(f'/bookings/admin/update/{create_booking.id}/', data=data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data
        assert response.data['detail'] == 'You do not have permission to perform this action.'

# ------------------TESTS DE PAGAR RESERVA ---------------------------------------------------------------------

    def test_iniciar_pago_happy_path(self, api_client_with_token, create_booking):
        response = api_client_with_token.post(f'/bookings/iniciar-pago/{create_booking.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert 'checkout_url' in response.data

    def test_iniciar_pago_server_error(self, api_client_with_token, monkeypatch):
        def mock_get_object_or_404(*args, **kwargs):
            raise Exception("Error del servidor")

        monkeypatch.setattr("bookings.views.get_object_or_404", mock_get_object_or_404)
        fake_id = uuid.uuid4()
        response = api_client_with_token.post(f'/bookings/iniciar-pago/{fake_id}/')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == 'Error del servidor'

# ------------------TESTS DE WEBHOOK RESERVA ---------------------------------------------------------------------
    
    @patch('stripe.Webhook.construct_event')
    def test_stripe_webhook_happy_path(self, mock_construct_event, create_booking, client):
        """
        Test para procesar el webhook de Stripe cuando el pago es confirmado
        """
        # Simulación de la respuesta del webhook
        mock_construct_event.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'metadata': {'booking_id': str(create_booking.id)},
                    'payment_intent': 'pi_test_12345'
                }
            }
        }

        # Realiza la solicitud al webhook
        response = client.post(
            reverse('stripe_webhook'), 
            content_type='application/json'
        )

        # Verificación de respuesta exitosa
        assert response.status_code == 200
        assert response.json() == {'status': 'success'}

        # Verificación de que la reserva se haya actualizado
        create_booking.refresh_from_db()
        assert create_booking.status == "CONFIRMED"
        assert create_booking.payment_intent_id == 'pi_test_12345'

    @patch('stripe.Webhook.construct_event')
    def test_stripe_webhook_signature_verification_failed(self, mock_construct_event, client):
        """
        Test para verificar que falle cuando la firma no es válida
        """
        # Forzar un error de verificación de firma
        mock_construct_event.side_effect = stripe.error.SignatureVerificationError(
            message="Firma no válida", 
            sig_header="fake_header"
        )

        response = client.post(
            reverse('stripe_webhook'), 
            content_type='application/json'
        )

        # Verificación de error de firma
        assert response.status_code == 400
        assert response.json() == {'error': 'Webhook signature verification failed'}

    @patch('stripe.Webhook.construct_event')
    def test_stripe_webhook_server_error(self, mock_construct_event, client):
        """
        Test para simular un error en el servidor al procesar el webhook
        """
        # Simular un error genérico del servidor
        mock_construct_event.side_effect = Exception("Error inesperado")

        response = client.post(
            reverse('stripe_webhook'), 
            content_type='application/json'
        )

        # Verificación de error del servidor
        assert response.status_code == 400
        assert response.json() == {'error': 'Error inesperado'}

# ------------------TESTS DE CANCELAR RESERVA ---------------------------------------------------------------------
    @patch('bookings.views.stripe.Refund.create')
    @patch('bookings.views.stripe.PaymentIntent.retrieve')
    @patch('bookings.views.send_mail')
    def test_cancelar_reserva_happy_path(self, mock_send_mail, mock_retrieve, mock_refund, api_client_with_token, create_booking):
        # Mock de la respuesta del intento de pago
        mock_retrieve.return_value = {
            "charges": {
                "data": [{"id": "ch_fake_123"}]
            }
        }
        # Mock de la creación del reembolso
        mock_refund.return_value = {"id": "re_123"}

        # Realiza la solicitud de cancelación
        response = api_client_with_token.put(f'/bookings/cancel/{create_booking.id}/')

        # Verificación de la respuesta
        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Reserva cancelada exitosamente"
        create_booking.refresh_from_db()
        assert create_booking.status == "CANCELLED"

        # Verificar que el envío de correo y el reembolso se realizaron
        mock_send_mail.assert_called_once()
        mock_refund.assert_called_once()

    @patch('bookings.views.stripe.Refund.create', side_effect=Exception("Stripe Refund Error"))
    @patch('bookings.views.stripe.PaymentIntent.retrieve')
    def test_cancelar_reserva_reembolso_error(self, mock_retrieve, mock_refund, api_client_with_token, create_booking):
        # Mock de la respuesta del intento de pago
        mock_retrieve.return_value = {
            "charges": {
                "data": [{"id": "ch_fake_123"}]
            }
        }

        # Realiza la solicitud de cancelación
        response = api_client_with_token.put(f'/bookings/cancel/{create_booking.id}/')

        # Verificar el estado de la respuesta
        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Reserva cancelada exitosamente"

        # Verificar que el método de reembolso fue llamado
        mock_refund.assert_called_once()

    def test_cancelar_reserva_ya_cancelada(self, api_client_with_token, create_booking):
        # Marcar reserva como cancelada
        create_booking.status = "CANCELLED"
        create_booking.save()

        response = api_client_with_token.put(f'/bookings/cancel/{create_booking.id}/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["message"] == "La reserva ya está cancelada"

    def test_cancelar_reserva_no_encontrada(self, api_client_with_token):
        fake_id = uuid.uuid4()
        response = api_client_with_token.put(f'/bookings/cancel/{fake_id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Reserva no encontrada"

    @patch('bookings.views.get_object_or_404', side_effect=Exception("Error inesperado"))
    def test_cancelar_reserva_server_error(self, mock_get, api_client_with_token, create_booking):
        response = api_client_with_token.put(f'/bookings/cancel/{create_booking.id}/')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Error del servidor" in response.data["error"]

   

    @patch('bookings.views.send_mail', side_effect=Exception("Email Send Error"))
    @patch('bookings.views.stripe.Refund.create')
    @patch('bookings.views.stripe.PaymentIntent.retrieve')
    def test_cancelar_reserva_email_error(self, mock_retrieve, mock_refund, mock_send_mail, api_client_with_token, create_booking):
        # Mock de la respuesta del intento de pago
        mock_retrieve.return_value = {
            "charges": {
                "data": [{"id": "ch_fake_123"}]
            }
        }

        # Realiza la solicitud de cancelación
        response = api_client_with_token.put(f'/bookings/cancel/{create_booking.id}/')

        # Verificar el estado de la respuesta
        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Reserva cancelada exitosamente"

        # Verificar que se haya intentado enviar el correo
        mock_send_mail.assert_called_once()

# ------------------TESTS DE NOTIFICACIONES RESERVA ----------------------------------------

    @staticmethod
    @patch('bookings.views.send_mail')
    def test_notify_users_about_hint(mock_send_mail, create_confirmed_booking):
        # Preparar la reserva con pista y correo verificado
        create_confirmed_booking.experience.hint = "Lleva calzado cómodo"
        create_confirmed_booking.experience.save()
        create_confirmed_booking.user.email_verified = True
        create_confirmed_booking.user.save()

        # Ejecutar la tarea
        notify_users_about_hint()

        # Verificar que se envió el correo correctamente
        assert mock_send_mail.called
        assert mock_send_mail.call_count == 1
        args, kwargs = mock_send_mail.call_args

        assert 'subject' in kwargs

        # Verificar el asunto (primer argumento)
        assert "✨ ¡Tu pista para la experiencia Go4Surprise está lista! ✨" in kwargs['subject']

        # Verificar el contenido del mensaje (segundo argumento)
        assert 'message' in kwargs
        assert "Go4Surprise" in kwargs['message']
        assert create_confirmed_booking.user.email in kwargs['recipient_list']

    @staticmethod
    @patch('bookings.views.send_mail')
    def test_notify_users_about_experience_details(mock_send_mail, create_experience_details_booking):
        # Preparar la reserva con datos completos y correo verificado
        create_experience_details_booking.user.email_verified = True
        create_experience_details_booking.user.save()

        # Ejecutar la tarea
        notify_users_about_experience_details()

        # Verificar que se envió el correo correctamente
        assert mock_send_mail.called
        assert mock_send_mail.call_count == 1
        args, kwargs = mock_send_mail.call_args

        assert 'subject' in kwargs

        # Verificar el asunto (primer argumento)
        assert "✨ Detalles de tu experiencia Go4Surprise ✨" in kwargs['subject']

        # Verificar el contenido del mensaje (segundo argumento)
        assert 'message' in kwargs
        assert "Go4Surprise" in kwargs['message']
        assert create_experience_details_booking.user.email in kwargs['recipient_list']

    @staticmethod
    @patch('bookings.views.send_mail')
    def test_notify_users_about_hint_no_email_verified(mock_send_mail, create_confirmed_booking):
        # Caso donde el usuario no tiene el correo verificado
        create_confirmed_booking.user.email_verified = False
        create_confirmed_booking.user.save()

        # Ejecutar la tarea
        notify_users_about_hint()

        # Verificar que no se envió el correo
        assert not mock_send_mail.called

    @staticmethod
    @patch('bookings.views.send_mail')
    def test_notify_users_about_hint_send_mail_error(mock_send_mail, create_confirmed_booking):
        # Preparar la reserva con pista y correo verificado
        create_confirmed_booking.experience.hint = "Lleva calzado cómodo"
        create_confirmed_booking.experience.save()
        create_confirmed_booking.user.email_verified = True
        create_confirmed_booking.user.save()

        # Ejecutar la tarea
        notify_users_about_hint()

        # Verificar que el intento de envío de correo fue realizado
        assert mock_send_mail.called
        
    @staticmethod
    @patch('bookings.views.send_mail')
    def test_notify_users_about_experience_details_send_mail_error(mock_send_mail, create_experience_details_booking):
        # Preparar la reserva con datos completos y correo verificado
        create_experience_details_booking.user.email_verified = True
        create_experience_details_booking.user.save()

        # Ejecutar la tarea
        notify_users_about_experience_details()

        # Verificar que el intento de envío de correo fue realizado
        assert mock_send_mail.called
