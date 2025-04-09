from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Usuario
from experiences.models import Experience
from reviews.models import Reviews
from django.contrib.auth.models import User


class TestPostReview(TestCase):
    def setUp(self):
        # Crear usuario y experiencia
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.experience, _ = Experience.objects.get_or_create(
            title='Experiencia Test',
            defaults={
                'description': 'Una experiencia de prueba',
                'price': 50.0,
                'location': 'Madrid',
                'time_preference': 'MORNING',
                'categories': ["ADVENTURE", "CULTURE"],
                'notas_adicionales': 'Preferencia en zona centro'
            }
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_post_review_happy_path(self):
        data = {
            'puntuacion': 4.5,
            'comentario': 'Excelente experiencia',
            'user': self.usuario.id,
            'experience': self.experience.id,
            'media_files': []  # Si hay archivos, deben ser objetos tipo archivo
        }
        response = self.client.post(
            reverse('create review'),
            data=data  # No se especifica formato para usar multipart automáticamente
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_post_review_invalid_score(self):
        data = {
            'puntuacion': 6.0,
            'comentario': 'Puntuación fuera de rango',
            'user': self.usuario.id,
            'experience': self.experience.id
        }
        response = self.client.post(
            reverse('create review'),
            data=data  # No se especifica formato para usar multipart automáticamente
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestGetReviews(TestCase):
    def setUp(self):
        # Crear usuario y experiencia
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.experience, _ = Experience.objects.get_or_create(
            title='Experiencia Test',
            defaults={
                'description': 'Una experiencia de prueba',
                'price': 50.0,
                'location': 'Madrid',
                'time_preference': 'MORNING',
                'categories': ["ADVENTURE", "CULTURE"],
                'notas_adicionales': 'Preferencia en zona centro'
            }
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_all_reviews(self):
        Reviews.objects.create(puntuacion=4.0, comentario='Good', user=self.usuario, experience=self.experience)
        response = self.client.get(reverse('get all reviews'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_reviews_by_user_happy_path(self):
        Reviews.objects.create(puntuacion=4.0, comentario='Good', user=self.usuario, experience=self.experience)
        response = self.client.get(reverse('get user reviews', args=[self.usuario.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)