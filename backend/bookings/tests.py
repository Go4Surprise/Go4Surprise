from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Usuario
from bookings.models import Booking
from bookings.serializers import ReservaSerializer
from datetime import date, timedelta
from model_bakery import baker
from django.contrib.auth.models import User
import uuid
from experiences.models import Experience  # Importar el modelo Experience


class BookingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Crea un usuario de Django
        self.user = User.objects.create_user(username="testuser", password="testpassword")

        # Crea un Usuario vinculado al User
        self.usuario = baker.make(Usuario, user=self.user)

        # Crea reservas asociadas a este usuario
        self.booking = baker.make(Booking, user=self.usuario, experience_date=date.today() + timedelta(days=5))
        self.past_booking = baker.make(Booking, user=self.usuario, experience_date=date.today() - timedelta(days=5))

        # Autenticamos usando `self.user` en lugar de `self.usuario`
        self.client.force_authenticate(user=self.user)

    #caso positivo
    def test_crear_reserva(self):
        url = reverse('crear_reserva')

        # Crear una experiencia ficticia
        self.experience = baker.make(Experience, price=50.00)

        data = {
            'user': self.usuario.id,  # Debe coincidir con el campo en el serializer
            'experience': self.experience.id,  # Clave foránea a la experiencia
            'participants': 2,  # Número de participantes
            'price': 50.00,  # Precio unitario
            'total_price': 100.00,  # Precio total (price * participants)
            'booking_date': str(date.today()),  # Fecha de la reserva (hoy)
            'experience_date': str(date.today() + timedelta(days=2)),  # Fecha de la experiencia
            'cancellable': True,  # Booleano si la reserva puede ser cancelada
            'status': 'PENDING',  # Estado inicial de la reserva
            'location': 'Local del evento',  # Local de la reserva
            'duration': 60,  # Duración de la reserva en minutos
            'category': 'ADVENTURE',  # Categoría de la experiencia
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    #casos negativos
    def test_crear_reserva_sin_datos(self):
        url = reverse('crear_reserva')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crear_reserva_con_datos_invalidos(self):
        url = reverse('crear_reserva')
        data = {
            'user': self.usuario.id,
            'experience': 'invalid-experience-id',
            'participants': -1,  # Número negativo de participantes
            'price': -50.00,  # Precio negativo
            'total_price': -100.00,
            'booking_date': 'invalid-date',
            'experience_date': 'invalid-date',
            'cancellable': 'not-a-boolean',
            'status': 'UNKNOWN_STATUS',  # Estado inválido
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    #caso positivo
    def test_obtener_reserva(self):
        url = reverse('obtener_reserva', kwargs={'id': self.booking.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.booking.id))

    #caso negativo
    def test_obtener_reserva_no_existente(self):
        fake_uuid = uuid.uuid4()  # Genera un UUID válido
        url = reverse('obtener_reserva', kwargs={'id': fake_uuid})  # Usa el UUID generado
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    #caso positivo
    def test_obtener_reservas_usuario(self):
        url = reverse('obtener_reservas_usuario', kwargs={'user_id': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    #casos negativos
    def test_obtener_reservas_usuario_sin_reservas(self):
        nuevo_usuario = baker.make(Usuario)
        url = reverse('obtener_reservas_usuario', kwargs={'user_id': nuevo_usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_obtener_reservas_usuario_con_id_invalido(self):
        fake_uuid = uuid.uuid4()  # Genera un UUID válido pero inexistente
        url = reverse('obtener_reservas_usuario', kwargs={'user_id': fake_uuid})  # Usa el UUID generado
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_obtener_reservas_usuario_no_autenticado(self):
        self.client.force_authenticate(user=None)
        url = reverse('obtener_reservas_usuario', kwargs={'user_id': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    #caso positivo
    def test_obtener_reservas_pasadas_usuario(self):
        url = reverse('obtener_reservas_pasadas_usuario', kwargs={'user_id': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    #caso negativos
    def test_obtener_reservas_pasadas_sin_reservas(self):
        nuevo_usuario = baker.make(Usuario)
        url = reverse('obtener_reservas_pasadas_usuario', kwargs={'user_id': nuevo_usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_obtener_reservas_pasadas_usuario_no_autenticado(self):
        self.client.force_authenticate(user=None)
        url = reverse('obtener_reservas_pasadas_usuario', kwargs={'user_id': self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
