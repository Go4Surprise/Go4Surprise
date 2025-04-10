# backend/tests/test_integration_reviews.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from users.models import Usuario
from experiences.models import Experience
from bookings.models import Booking
from reviews.models import Reviews
from datetime import date, timedelta
import json
import tempfile
from PIL import Image
import io
import os

class ReviewsIntegrationTestCase(TestCase):
    """
    Pruebas de integración para el flujo completo de reseñas:
    desde la creación de una experiencia y reserva hasta la publicación y consulta de reseñas.
    """
    
    def setUp(self):
        # Configurar cliente API
        self.client = APIClient()
        
        # Crear un usuario de prueba (esto también creará un objeto Usuario por el signal)
        self.user = User.objects.create_user(
            username="review_user",
            password="review_password",
            email="review@test.com"
        )
        
        # Obtener y actualizar el objeto Usuario
        self.usuario = Usuario.objects.get(user=self.user)
        self.usuario.name = "Review"
        self.usuario.surname = "Test"
        self.usuario.phone = "123789456"
        self.usuario.birthdate = "1988-07-22"
        self.usuario.email_verified = True
        self.usuario.save()
        
        # Crear una experiencia
        self.experience = Experience.objects.create(
            title="Review Test Experience",
            description="Experiencia para pruebas de reseñas",
            price=65.00,
            location="Review Location",
            time_preference="MORNING",
            hint="Review hint",
            categories=["CULTURE", "MUSIC"]
        )
        
        # Crear una reserva pasada (para poder dejar reseña)
        self.booking = Booking.objects.create(
            participants=2,
            price=65.00,
            total_price=130.00,
            booking_date=date.today() - timedelta(days=10),
            experience_date=date.today() - timedelta(days=5),
            cancellable=False,
            status="CONFIRMED",
            user=self.usuario,
            experience=self.experience
        )
        
        # Autenticar usuario
        self.client.force_authenticate(user=self.user)
        
        # Crear una imagen temporal para la prueba
        self.image = self._create_test_image()
    
    def _create_test_image(self):
        """Crea una imagen temporal para pruebas"""
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            image = Image.new('RGB', (100, 100), 'white')
            image.save(f, 'JPEG')
            return f.name
    
    def tearDown(self):
        """Limpia los archivos temporales"""
        if hasattr(self, 'image') and os.path.exists(self.image):
            os.unlink(self.image)
    
    def test_review_full_flow(self):
        """
        Prueba el flujo completo de reseñas:
        - Creación de reseña con imagen
        - Consulta de reseñas por experiencia
        - Consulta de reseñas por usuario
        """
        # Paso 1: Crear una reseña con imagen
        with open(self.image, 'rb') as img:
            review_data = {
                'puntuacion': 4.5,
                'comentario': 'Fue una experiencia increíble, totalmente recomendable.',
                'user': self.usuario.id,
                'experience': self.experience.id,
                'media_files': [img]
            }
            
            create_review_response = self.client.post(
                reverse('create review'),
                data=review_data,
                format='multipart'
            )
        
        self.assertEqual(create_review_response.status_code, status.HTTP_201_CREATED)
        review_id = create_review_response.data.get('id')
        
        # Paso 2: Obtener todas las reseñas
        all_reviews_response = self.client.get(reverse('get all reviews'))
        self.assertEqual(all_reviews_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(all_reviews_response.data), 1)
        
        # Paso 3: Obtener las reseñas por experiencia
        experience_reviews_response = self.client.get(
            reverse('get experience reviews', kwargs={'experience_id': self.experience.id})
        )
        self.assertEqual(experience_reviews_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(experience_reviews_response.data), 1)
        
        # Paso 4: Obtener las reseñas por usuario
        user_reviews_response = self.client.get(
            reverse('get user reviews', kwargs={'user_id': self.usuario.id})
        )
        self.assertEqual(user_reviews_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(user_reviews_response.data), 1)
        
        # Paso 5: Verificar que la reseña se creó correctamente en la base de datos
        review = Reviews.objects.get(id=review_id)
        self.assertEqual(float(review.puntuacion), 4.5)
        self.assertEqual(review.user.id, self.usuario.id)
        self.assertEqual(review.experience.id, self.experience.id)
        
        # Paso 6: Verificar que exista al menos una media asociada a la reseña
        self.assertGreaterEqual(review.media.count(), 1)
        
        # Paso 7: Obtener las últimas 10 reseñas
        latest_reviews_response = self.client.get(reverse('get latest ten reviews'))
        self.assertEqual(latest_reviews_response.status_code, status.HTTP_200_OK)


class MultipleUsersReviewsIntegrationTestCase(TestCase):
    """
    Pruebas de integración para flujos de reseñas con múltiples usuarios
    interactuando con la misma experiencia.
    """
    
    def setUp(self):
        # Configurar cliente API
        self.client = APIClient()
        
        # Crear varios usuarios de prueba
        self.users = []
        self.usuarios = []
        
        for i in range(3):
            # Crear User (esto también creará un objeto Usuario por el signal)
            user = User.objects.create_user(
                username=f"review_user_{i}",
                password="review_password",
                email=f"review{i}@test.com"
            )
            self.users.append(user)
            
            # Obtener y actualizar el objeto Usuario
            usuario = Usuario.objects.get(user=user)
            usuario.name = f"Review{i}"
            usuario.surname = "Test"
            usuario.phone = f"12345678{i}"
            usuario.birthdate = "1990-01-01"
            usuario.email_verified = True
            usuario.save()
            
            self.usuarios.append(usuario)
        
        # Crear una experiencia compartida
        self.shared_experience = Experience.objects.create(
            title="Shared Experience",
            description="Experiencia compartida para pruebas",
            price=80.00,
            location="Shared Location",
            time_preference="AFTERNOON",
            hint="Shared hint",
            categories=["ADVENTURE", "SPORTS"]
        )
        
        # Crear reservas para cada usuario
        self.bookings = []
        for usuario in self.usuarios:
            booking = Booking.objects.create(
                participants=1,
                price=80.00,
                total_price=80.00,
                booking_date=date.today() - timedelta(days=15),
                experience_date=date.today() - timedelta(days=7),
                cancellable=False,
                status="CONFIRMED",
                user=usuario,
                experience=self.shared_experience
            )
            self.bookings.append(booking)
    
    def test_multiple_users_reviews(self):
        """
        Prueba que varios usuarios puedan dejar reseñas para la misma experiencia
        y que se puedan consultar adecuadamente.
        """
        # Crear reseñas para cada usuario
        for i, (user, usuario) in enumerate(zip(self.users, self.usuarios)):
            # Autenticar como este usuario
            self.client.force_authenticate(user=user)
            
            # Crear reseña
            puntuacion = 3.5 + (i * 0.5)  # Diferentes puntuaciones: 3.5, 4.0, 4.5
            
            review_data = {
                'puntuacion': puntuacion,
                'comentario': f'Reseña del usuario {i} para la experiencia compartida',
                'user': usuario.id,
                'experience': self.shared_experience.id
            }
            
            create_review_response = self.client.post(
                reverse('create review'),
                data=review_data,
                format='multipart'
            )
            
            self.assertEqual(create_review_response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que todas las reseñas se hayan creado
        experience_reviews = Reviews.objects.filter(experience=self.shared_experience)
        self.assertEqual(experience_reviews.count(), len(self.usuarios))
        
        # Autenticar como primer usuario para hacer consultas
        self.client.force_authenticate(user=self.users[0])
        
        # Verificar que podemos obtener todas las reseñas de la experiencia
        experience_reviews_response = self.client.get(
            reverse('get experience reviews', kwargs={'experience_id': self.shared_experience.id})
        )
        self.assertEqual(experience_reviews_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(experience_reviews_response.data), len(self.usuarios))
        
        # Verificar las puntuaciones
        puntuaciones = [float(review['puntuacion']) for review in experience_reviews_response.data]
        self.assertIn(3.5, puntuaciones)
        self.assertIn(4.0, puntuaciones)
        self.assertIn(4.5, puntuaciones)