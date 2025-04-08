import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from experiences.models import Experience
from experiences.serializers import ExperienceSerializer
from unittest.mock import patch
from django.urls import reverse
from django.http import Http404
from users.models import Usuario
from uuid import uuid4

@pytest.fixture
def api_client_with_admin_token(create_admin_user):
    client = APIClient()
    client.force_authenticate(user=create_admin_user.user)
    return client

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
def create_experience():
    return Experience.objects.create(
        title='Test Experience',
        description='An exciting test experience',
        price=50.0,
        location='New York',
        time_preference='MORNING',
        categories=["ADVENTURE", "CULTURE"],
        notas_adicionales='Near central park'
    )

@pytest.mark.django_db
class TestExperienceViews:

   # ------------------TESTS DE ACTUALIZACIÓN DE EXPERIENCIA ------------------------
    def test_update_experience_happy_path(self, api_client_with_admin_token, create_experience):
        """
        Test para actualizar una experiencia existente (Ruta Feliz)
        """
        data = {
            "title": "Updated Experience",
            "description": "An updated exciting test experience",
            "price": 75.0,
            "location": "Los Angeles"
        }
        url = reverse('update_experience', args=[create_experience.id])
        response = api_client_with_admin_token.put(url, data=data, format='json')

        # Verificar respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == "Updated Experience"
        assert float(response.data['price']) == 75.0  # Corregido

    def test_update_experience_not_found(self, api_client_with_admin_token):
        """
        Test para actualizar una experiencia que no existe
        """
        fake_id = uuid4()  # Usar uuid4 para generar un UUID válido
        data = {
            "title": "Nonexistent Experience"
        }
        url = reverse('update_experience', args=[fake_id])
        response = api_client_with_admin_token.put(url, data=data, format='json')

        # Verificar error 404
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data['error'] == "Experience not found"

    def test_update_experience_server_error(self, api_client_with_admin_token, create_experience, monkeypatch):
        """
        Test para simular un error en el servidor al actualizar una experiencia
        """
        # Mock para provocar un error del servidor
        def mock_save(*args, **kwargs):
            raise Exception("Unexpected server error")

        monkeypatch.setattr(Experience, "save", mock_save)

        data = {
            "title": "Updated Experience with Error"
        }
        url = reverse('update_experience', args=[create_experience.id])
        response = api_client_with_admin_token.put(url, data=data, format='json')

        # Verificar error 500
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Server error" in response.data['error']

    # ------------------TESTS DE LISTA DE EXPERIENCIAS ------------------------
    def test_list_experiences_happy_path(self, api_client_with_admin_token, create_experience):
        """
        Test para listar todas las experiencias
        """
        url = reverse('list_experiences')
        response = api_client_with_admin_token.get(url)

        # Verificar respuesta exitosa
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) > 0  # Debe haber al menos una experiencia

    def test_list_experiences_server_error(self, api_client_with_admin_token):
        """
        Test para simular un error en el servidor al listar experiencias
        """
        # Mock para provocar un error del servidor
        with patch('experiences.models.Experience.objects.all', side_effect=Exception("Unexpected server error")):
            url = reverse('list_experiences')

            # Acceder al cliente de prueba desde el fixture
            response = api_client_with_admin_token.get(url)

            # Verificar error 500
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert response.data == {"error": "Server error: Unexpected server error"}