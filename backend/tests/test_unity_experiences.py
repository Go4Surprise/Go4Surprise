from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from experiences.models import Experience
from users.models import Usuario
from uuid import uuid4
from unittest.mock import patch


class TestUpdateExperience(TestCase):
    def setUp(self):
        # Crear usuario administrador
        self.user, _ = User.objects.get_or_create(
            username='adminuser',
            defaults={'password': 'adminpass', 'is_superuser': True, 'is_staff': True}
        )
        self.admin_user, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Admin', 'surname': 'User', 'email': 'adminuser@example.com'}
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Crear experiencia
        self.experience = Experience.objects.create(
            title='Test Experience',
            description='An exciting test experience',
            price=50.0,
            location='New York',
            time_preference='MORNING',
            categories=["ADVENTURE", "CULTURE"],
            notas_adicionales='Near central park'
        )

    def test_update_experience_happy_path(self):
        data = {
            "title": "Updated Experience",
            "description": "An updated exciting test experience",
            "price": 75.0,
            "location": "Los Angeles"
        }
        url = reverse('update_experience', args=[self.experience.id])
        response = self.client.put(url, data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Updated Experience")
        self.assertEqual(float(response.data['price']), 75.0)

    def test_update_experience_not_found(self):
        fake_id = uuid4()
        data = {
            "title": "Nonexistent Experience"
        }
        url = reverse('update_experience', args=[fake_id])
        response = self.client.put(url, data=data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], "Experience not found")

    def test_update_experience_server_error(self):
        def mock_save(*args, **kwargs):
            raise Exception("Unexpected server error")

        with patch('experiences.models.Experience.save', mock_save):
            data = {
                "title": "Updated Experience with Error"
            }
            url = reverse('update_experience', args=[self.experience.id])
            response = self.client.put(url, data=data, format='json')

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("Server error", response.data['error'])


class TestListExperiences(TestCase):
    def setUp(self):
        # Crear usuario administrador
        self.user, _ = User.objects.get_or_create(
            username='adminuser',
            defaults={'password': 'adminpass', 'is_superuser': True, 'is_staff': True}
        )
        self.admin_user, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Admin', 'surname': 'User', 'email': 'adminuser@example.com'}
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Crear experiencia
        self.experience = Experience.objects.create(
            title='Test Experience',
            description='An exciting test experience',
            price=50.0,
            location='New York',
            time_preference='MORNING',
            categories=["ADVENTURE", "CULTURE"],
            notas_adicionales='Near central park'
        )

    def test_list_experiences_happy_path(self):
        url = reverse('list_experiences')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_list_experiences_server_error(self):
        with patch('experiences.models.Experience.objects.all', side_effect=Exception("Unexpected server error")):
            url = reverse('list_experiences')
            response = self.client.get(url)

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertEqual(response.data, {"error": "Server error: Unexpected server error"})