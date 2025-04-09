import json
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Usuario, Preferences
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
from django.urls import reverse
import uuid


@pytest.fixture
def api_client_with_token(create_user):
    client = APIClient()
    refresh = RefreshToken.for_user(create_user.user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def create_user(transactional_db):
    User.objects.filter(username='testuser').delete()
    user = User.objects.create_user(username='testuser', password='testpass')
    Usuario.objects.filter(user=user).delete()
    return Usuario.objects.create(user=user, name='Test', surname='User', email='testuser@example.com')


@pytest.fixture
def create_admin_user(transactional_db):
    User.objects.filter(username='adminuser').delete()
    user = User.objects.create_user(username='adminuser', password='adminpass', is_superuser=True, is_staff=True)
    Usuario.objects.filter(user=user).delete()
    return Usuario.objects.create(user=user, name='Admin', surname='User', email='adminuser@example.com')


@pytest.fixture
def api_client_with_admin_token(create_admin_user):
    client = APIClient()
    refresh = RefreshToken.for_user(create_admin_user.user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.mark.django_db
class TestUserViews:
    # ------------------------- TEST PARA REGISTRO -------------------------
    def test_register_user_happy_path(self, client):
        data = {
            "username": "newuser",
            "password": "newpassword",
            "name": "New",
            "surname": "User",
            "email": "newuser@example.com",
            "phone": "123456789",
            "birthdate": "2000-01-01"
        }
        response = client.post(
            reverse('register'),
            data=json.dumps(data),  # convierte a string JSON
            content_type='application/json'  # especifica tipo de contenido
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data
        assert response.data["verification_sent"] is True

    def test_register_user_invalid_data(self, client):
        data = {
            "username": "",
            "password": "short",
            "email": "invalidemail"
        }
        response = client.post(
            reverse('register'),
            data=json.dumps(data),  # convierte a string JSON
            content_type='application/json'  # especifica tipo de contenido
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in response.data
        assert "password" in response.data
        assert "email" in response.data

    # ------------------------- TEST PARA LOGIN -------------------------
    def test_login_user_happy_path(self, client, create_user):
        data = {
            "username": create_user.user.username,
            "password": "testpass"
        }
        create_user.email_verified = True
        create_user.save()

        response = client.post(
            reverse('login'),
            data=json.dumps(data),  # convierte a string JSON
            content_type='application/json'  # especifica tipo de contenido
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_user_invalid_credentials(self, client):
        data = {
            "username": "nonexistentuser",
            "password": "wrongpassword"
        }
        response = client.post(
            reverse('login'),
            data=json.dumps(data),  # convierte a string JSON
            content_type='application/json'  # especifica tipo de contenido
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    # ------------------------- TEST PARA VERIFICAR EMAIL -------------------------
    def test_verify_email_happy_path(self, client, create_user):
        create_user.refresh_verification_token()
        response = client.get(reverse('verify_email') + f"?token={create_user.email_verification_token}&user_id={create_user.id}")
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data

    def test_verify_email_invalid_token(self, client, create_user):
        response = client.get(reverse('verify_email') + f"?token=invalidtoken&user_id={create_user.id}")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    # ------------------------- TEST PARA ACTUALIZAR PERFIL -------------------------
    def test_update_user_profile_happy_path(self, api_client_with_token, create_user):
        data = {
            "name": "Updated",
            "surname": "User",
            "phone": "987654321"
        }
        response = api_client_with_token.put(reverse('update_user_profile'), data=data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated"
        assert response.data["phone"] == "987654321"

    def test_update_user_profile_invalid_data(self, api_client_with_token):
        data = {
            "email": "invalidemail"
        }
        response = api_client_with_token.put(reverse('update_user_profile'), data=data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    # ------------------------- TEST PARA ELIMINAR CUENTA -------------------------
    def test_delete_user_account_happy_path(self, api_client_with_token, create_user):
        response = api_client_with_token.delete(reverse('delete_user_account'))
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_user_account_not_authenticated(self, client):
        response = client.delete(reverse('delete_user_account'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ------------------------- TEST PARA CAMBIAR CONTRASEÑA -------------------------
    def test_change_password_happy_path(self, api_client_with_token, create_user):
        data = {
            "current_password": "testpass",
            "new_password": "newtestpass"
        }
        response = api_client_with_token.post(reverse('change_password'), data=data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Contraseña actualizada correctamente"

    def test_change_password_invalid_current_password(self, api_client_with_token):
        data = {
            "current_password": "wrongpass",
            "new_password": "newtestpass"
        }
        response = api_client_with_token.post(reverse('change_password'), data=data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "error" in response.data

    # ------------------------- TEST PARA OBTENER INFORMACIÓN DEL USUARIO -------------------------
    def test_get_user_info_happy_path(self, api_client_with_token, create_user):
        response = api_client_with_token.get(reverse('get-user-info'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == create_user.name
        assert response.data["email"] == create_user.email

    def test_get_user_info_not_authenticated(self, client):
        response = client.get(reverse('get-user-info'))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ------------------------- TEST PARA PREFERENCIAS -------------------------
    def test_update_preferences_happy_path(self, api_client_with_token, create_user):
        data = {
            "music": ["rock", "pop"],
            "sports": ["football"]
        }
        response = api_client_with_token.patch(reverse('update-preferences'), data=data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data["music"] == ["rock", "pop"]
        assert response.data["sports"] == ["football"]

    def test_update_preferences_invalid_data(self, api_client_with_token):
        data = {
            "music": "notalist"
        }
        response = api_client_with_token.patch(reverse('update-preferences'), data=data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
