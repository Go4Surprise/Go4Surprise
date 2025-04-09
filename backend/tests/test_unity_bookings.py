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