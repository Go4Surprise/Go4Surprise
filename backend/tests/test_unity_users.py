import json
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Usuario, Preferences
from django.urls import reverse


class TestRegisterUser(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )

    def test_register_user_happy_path(self):
        data = {
            "username": "newuser",
            "password": "newpassword",
            "name": "New",
            "surname": "User",
            "email": "newuser@example.com",
            "phone": "123456789",
            "birthdate": "2000-01-01"
        }
        response = self.client.post(
            reverse('register'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertTrue(response.data["verification_sent"])

    def test_register_user_invalid_data(self):
        data = {
            "username": "",
            "password": "short",
            "email": "invalidemail"
        }
        response = self.client.post(
            reverse('register'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertIn("password", response.data)
        self.assertIn("email", response.data)


class TestLoginUser(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={
                'name': 'Test',
                'surname': 'User',
                'email': 'testuser@example.com',
                'email_verified': True  # Verifica el correo electrónico
            }
        )
        self.usuario.email_verified = True
        self.usuario.save()

    def test_login_user_happy_path(self):
        data = {
            "username": self.user.username,
            "password": "testpass"
        }
        response = self.client.post(
            reverse('login'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_user_invalid_credentials(self):
        data = {
            "username": "nonexistentuser",
            "password": "wrongpassword"
        }
        response = self.client.post(
            reverse('login'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)


class TestVerifyEmail(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )

    def test_verify_email_happy_path(self):
        self.usuario.refresh_verification_token()
        response = self.client.get(reverse('verify_email') + f"?token={self.usuario.email_verification_token}&user_id={self.usuario.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_verify_email_invalid_token(self):
        response = self.client.get(reverse('verify_email') + f"?token=invalidtoken&user_id={self.usuario.id}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)


class TestUpdateUserProfile(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.client.force_authenticate(user=self.user)

    def test_update_user_profile_happy_path(self):
        data = {
            "name": "Updated",
            "surname": "User",
            "phone": "987654321"
        }
        response = self.client.put(reverse('update_user_profile'), data=data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated")
        self.assertEqual(response.data["phone"], "987654321")

    def test_update_user_profile_invalid_data(self):
        data = {
            "email": "invalidemail"
        }
        response = self.client.put(reverse('update_user_profile'), data=data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)


class TestDeleteUserAccount(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.client.force_authenticate(user=self.user)

    def test_delete_user_account_happy_path(self):
        response = self.client.delete(reverse('delete_user_account'))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_user_account_not_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(reverse('delete_user_account'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestChangePassword(TestCase):
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

    def test_change_password_invalid_current_password(self):
        data = {
            "current_password": "wrongpass",
            "new_password": "newtestpass"
        }
        response = self.client.post(reverse('change_password'), data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)


class TestGetUserInfo(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.client.force_authenticate(user=self.user)

    def test_get_user_info_happy_path(self):
        response = self.client.get(reverse('get-user-info'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.usuario.name)
        self.assertEqual(response.data["email"], self.usuario.email)

    def test_get_user_info_not_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse('get-user-info'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestUpdatePreferences(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, _ = User.objects.get_or_create(username='testuser', defaults={'password': 'testpass'})
        self.usuario, _ = Usuario.objects.get_or_create(
            user=self.user,
            defaults={'name': 'Test', 'surname': 'User', 'email': 'testuser@example.com'}
        )
        self.client.force_authenticate(user=self.user)

    def test_update_preferences_happy_path(self):
        data = {
            "music": ["rock", "pop"],
            "sports": ["football"]
        }
        response = self.client.patch(reverse('update-preferences'), data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["music"], ["rock", "pop"])
        self.assertEqual(response.data["sports"], ["football"])

    def test_update_preferences_invalid_data(self):
        data = {
            "music": "notalist"
        }
        response = self.client.patch(reverse('update-preferences'), data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)