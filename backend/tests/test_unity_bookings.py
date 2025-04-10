from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from users.models import Usuario
from bookings.models import Booking
from experiences.models import Experience
from datetime import date, timedelta
from django.utils.timezone import now
import uuid
from unittest.mock import patch



class TestCrearReserva(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={
                'name': 'Test',
                'surname': 'User',
                'email': 'testuser@example.com'
            }
        )
        self.client.force_authenticate(user=self.user)

    def test_crear_reserva_happy_path(self):
        data = {
            'nombre': 'Reserva Test',
            'user': str(self.usuario.id),
            'experience_date': '2025-04-01',
            'status': 'PENDING',
            'participants': 2,
            'price': 50.0,
            'location': 'Madrid',
            'time_preference': 'MORNING',
            'categories': ["ADVENTURE", "CULTURE"],
            'notas_adicionales': 'Preferencia en zona centro'
        }
        response = self.client.post('/bookings/crear-reserva/', data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    def test_crear_reserva_bad_request(self):
        data = {}
        response = self.client.post('/bookings/crear-reserva/', data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('participants', response.data)
        self.assertIn('price', response.data)
        self.assertIn('time_preference', response.data)

    def tearDown(self):
        Usuario.objects.all().delete()
        User.objects.all().delete()

class TestObtenerReserva(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={
                'name': 'Test',
                'surname': 'User',
                'email': 'testuser@example.com'
            }
        )
        self.client.force_authenticate(user=self.user)
        self.experience = Experience.objects.create(
            title='Experiencia Test',
            description='Una experiencia de prueba',
            price=50.0,
            location='Madrid',
            time_preference='MORNING',
            categories=["ADVENTURE", "CULTURE"]
        )
        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date(2025, 4, 1),
            booking_date=date.today(),
            cancellable=True,
            status="PENDING",
            participants=2,
            price=50.0,
            total_price=100.0
        )

    def test_get_booking_happy_path(self):
        response = self.client.get(f'/bookings/obtener-reserva/{self.booking.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.booking.id))
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(response.data['participants'], 2)
        self.assertEqual(response.data['total_price'], 100.0)

    def test_get_booking_not_found(self):
        fake_id = uuid.uuid4()
        response = self.client.get(f'/bookings/obtener-reserva/{fake_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Reserva no encontrada')


class TestObtenerReservasUsuario(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={
                'name': 'Test',
                'surname': 'User',
                'email': 'testuser@example.com'
            }
        )
        self.client.force_authenticate(user=self.user)
        self.experience = Experience.objects.create(
            title='Experiencia Test',
            description='Una experiencia de prueba',
            price=50.0,
            location='Madrid',
            time_preference='MORNING',
            categories=["ADVENTURE", "CULTURE"]
        )
        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date(2025, 4, 1),
            booking_date=date.today(),
            cancellable=True,
            status="PENDING",
            participants=2,
            price=50.0,
            total_price=100.0
        )

    def test_get_user_bookings_happy_path(self):
        response = self.client.get(f'/bookings/users/{self.usuario.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
        reserva = response.data[0]
        self.assertEqual(reserva['id'], str(self.booking.id))
        self.assertEqual(reserva['status'], 'PENDING')
        self.assertEqual(reserva['participants'], 2)
        self.assertEqual(reserva['total_price'], 100.0)

    def test_get_user_bookings_user_not_found(self):
        fake_id = uuid.uuid4()
        response = self.client.get(f'/bookings/users/{fake_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Usuario no encontrado')

class BookingViewsExtraTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='normaluser', password='normalpass')
        self.usuario = Usuario.objects.get(user=self.user)
        self.usuario.email_verified = True
        self.usuario.save()
        self.client.force_authenticate(user=self.user)

        self.experience = Experience.objects.create(
            title='Exp Test',
            description='Desc',
            price=40.0,
            location='TestLoc',
            time_preference='MORNING',
            hint='Pista',
            categories=["CULTURE"]
        )

        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date.today() + timedelta(days=5),
            booking_date=date.today(),
            cancellable=True,
            status="PENDING",
            participants=1,
            price=40.0,
            total_price=40.0
        )

        self.past_booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date.today() - timedelta(days=3),
            booking_date=date.today() - timedelta(days=10),
            cancellable=True,
            status="CONFIRMED",
            participants=1,
            price=40.0,
            total_price=40.0
        )

    def test_obtener_reservas_pasadas_usuario(self):
        url = reverse('obtener_reservas_pasadas_usuario', kwargs={'user_id': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_actualizar_estado_reserva_valido(self):
        url = reverse('actualizar_estado_reserva', kwargs={'id': self.booking.id})
        data = {'status': 'CONFIRMED'}
        response = self.client.put(url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_actualizar_estado_reserva_invalido(self):
        url = reverse('actualizar_estado_reserva', kwargs={'id': self.booking.id})
        data = {'status': 'INVALIDO'}
        response = self.client.put(url, data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancelar_reserva(self):
        url = reverse('cancelar_reserva', kwargs={'id': self.booking.id})
        response = self.client.put(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cancelar_reserva_ya_cancelada(self):
        self.booking.status = "CANCELLED"
        self.booking.save()
        url = reverse('cancelar_reserva', kwargs={'id': self.booking.id})
        response = self.client.put(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancelar_reserva_no_encontrada(self):
        fake_id = uuid.uuid4()
        url = reverse('cancelar_reserva', kwargs={'id': fake_id})
        response = self.client.put(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class TestSendScheduledNotifications(TestCase):
    def test_send_notifications_endpoint_success(self):
        response = self.client.get('/bookings/send-scheduled-notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')


class TestAdminBookingViews(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', password='adminpass', email='admin@test.com')
        self.usuario = Usuario.objects.get(user=self.admin)
        self.experience = Experience.objects.create(
            title='Exp',
            description='Desc',
            price=20.0,
            location='Loc',
            time_preference='MORNING',
            categories=["ADVENTURE"]
        )
        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date.today(),
            booking_date=date.today(),
            cancellable=True,
            status="PENDING",
            participants=1,
            price=20.0,
            total_price=20.0
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_booking_list(self):
        url = reverse('admin_booking_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_booking_update_valid(self):
        url = reverse('admin_booking_update', kwargs={'pk': self.booking.id})
        data = {'status': 'CONFIRMED'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_booking_update_invalid_experience(self):
        url = reverse('admin_booking_update', kwargs={'pk': self.booking.id})
        data = {'experience_id': '123'}  # ID no válido como UUID
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  

    def test_admin_booking_update_not_found(self):
        url = reverse('admin_booking_update', kwargs={'pk': uuid.uuid4()})
        data = {'status': 'CONFIRMED'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class TestIniciarPago(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='payuser', password='paypass')
        self.usuario = Usuario.objects.get(user=self.user)
        self.experience = Experience.objects.create(
            title='Pago Test',
            description='desc',
            price=30.0,
            location='Barcelona',
            time_preference='AFTERNOON',
            categories=["ADVENTURE"]
        )
        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date.today() + timedelta(days=2),
            booking_date=date.today(),
            cancellable=True,
            status="CONFIRMED",
            participants=2,
            price=30.0,
            total_price=60.0
        )

    def test_iniciar_pago_reserva_existente(self):
        url = reverse('iniciar_pago', kwargs={'booking_id': self.booking.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('checkout_url', response.data)

    def test_iniciar_pago_reserva_inexistente(self):
        fake_id = uuid.uuid4()
        response = self.client.post(f'/bookings/iniciar-pago/{fake_id}/')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_webhook_sin_firma(self):
        response = self.client.post('/bookings/stripe-webhook/', data={}, content_type='application/json')
        self.assertEqual(response.status_code, 400)

class TestErroresBookingViews(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='errortester', password='testpass')
        self.usuario = Usuario.objects.get(user=self.user)
        self.client.force_authenticate(user=self.user)

        self.experience = Experience.objects.create(
            title='Test Exp',
            description='Descripción',
            price=30.0,
            location='Test City',
            time_preference='MORNING',
            categories=["CULTURE"]
        )

        self.booking = Booking.objects.create(
            user=self.usuario,
            experience=self.experience,
            experience_date=date.today() + timedelta(days=5),
            booking_date=date.today(),
            cancellable=True,
            status="PENDING",
            participants=2,
            price=30.0,
            total_price=60.0
        )

    def test_crear_reserva_excepcion(self):
        with patch('bookings.views.CrearReservaSerializer.is_valid', side_effect=Exception("boom")):
            data = {
                'nombre': 'Error Test',
                'user': str(self.usuario.id),
                'experience_date': '2025-05-05',
                'status': 'PENDING',
                'participants': 2,
                'price': 20.0,
                'location': 'Madrid',
                'time_preference': 'MORNING',
                'categories': ["CULTURE"]
            }
            response = self.client.post('/bookings/crear-reserva/', data, format='json')
            self.assertEqual(response.status_code, 500)
            self.assertIn("error", response.data)

    def test_obtener_reserva_excepcion(self):
        with patch('bookings.views.get_object_or_404', side_effect=Exception("fail")):
            response = self.client.get(f'/bookings/obtener-reserva/{self.booking.id}/')
            self.assertEqual(response.status_code, 500)
            self.assertIn("error", response.data)

    def test_actualizar_estado_reserva_exception(self):
        url = reverse('actualizar_estado_reserva', kwargs={'id': self.booking.id})
        with patch('bookings.views.get_object_or_404', side_effect=Exception("crash")):
            response = self.client.put(url, data={'status': 'CONFIRMED'}, format='json')
            self.assertEqual(response.status_code, 500)
            self.assertIn("error", response.data)


    def test_send_notifications_fails(self):
        with patch('bookings.views.notify_users_about_hint', side_effect=Exception("fail")):
            response = self.client.get('/bookings/send-scheduled-notifications/')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.json()["status"], "error")
            self.assertIn("fail", response.json()["message"])
