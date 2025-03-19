from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from model_bakery import baker
from experiences.models import Experience
import uuid

class ExperienceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario de Django
        self.user = User.objects.create_user(username="testuser", password="testpassword")
        self.client.force_authenticate(user=self.user)

        # Crear una experiencia
        self.experience = baker.make(Experience, title="Test Experience", price=50.00, location="Madrid", duration=120, category="ADVENTURE")

    #caso positivo
    def test_update_experience_success(self):
        url = reverse('update_experience', kwargs={'experience_id': self.experience.id})
        data = {
            'title': "Updated Experience",
            'price': 75.00,
            'location': "Barcelona",
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Updated Experience")
        self.assertEqual(float(response.data['price']), 75.00)
        self.assertEqual(response.data['location'], "Barcelona")

    #casos negativos
    def test_update_experience_not_authenticated(self):
        self.client.force_authenticate(user=None)
        url = reverse('update_experience', kwargs={'experience_id': self.experience.id})
        response = self.client.put(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_experience_not_found(self):
        fake_uuid = uuid.uuid4()
        url = reverse('update_experience', kwargs={'experience_id': fake_uuid})
        response = self.client.put(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_experience_invalid_data(self):
        url = reverse('update_experience', kwargs={'experience_id': self.experience.id})
        data = {
            'price': -50.00,  # Precio negativo (debería ser inválido)
            'duration': "invalid"  # Valor no numérico (debería dar error)
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)  
        self.assertIn('duration', response.data)

    def test_update_experience_partial_update(self):
        url = reverse('update_experience', kwargs={'experience_id': self.experience.id})
        data = {
            'title': "Partially Updated Experience"
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Partially Updated Experience")
