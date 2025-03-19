from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Usuario, Preferences
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken


class UserTests(APITestCase):
    
    def setUp(self):
        # Crear usuario de Django
        self.user = User.objects.create_user(username="testuser", password="testpassword", email="test@example.com")

        # Crear Usuario asociado al usuario de Django
        self.usuario = Usuario.objects.create(user=self.user, name="John", surname="Doe", email="test@example.com", phone="123456789")

        # Crear token JWT para autenticación
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # URL de las rutas
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.update_preferences_url = reverse('update-preferences')
        self.get_user_info_url = reverse('get-user-info')
        self.get_usuario_id_url = reverse('get-usuario-id')
        self.update_profile_url = reverse('update_user_profile')
        self.delete_account_url = reverse('delete_user_account')
        self.change_password_url = reverse('change_password')

    ## ----------------------------------
    ## ✅ PRUEBAS POSITIVAS
    ## ----------------------------------

    def test_register_user_success(self):
        """Registrar un usuario exitosamente"""
        data = {
            "username": "newuser",
            "password": "securepassword",
            "name": "Alice",
            "surname": "Smith",
            "email": "alice@example.com",
            "phone": "987654321"
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_login_success(self):
        """Inicio de sesión exitoso"""
        data = {"username": "testuser", "password": "testpassword"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)  # El token debe estar presente

    def test_update_preferences_success(self):
        """Actualizar preferencias correctamente"""
        data = {"music": ["Rock", "Pop"], "sports": ["Football"]}
        response = self.client.patch(self.update_preferences_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_info_success(self):
        """Obtener la información del usuario autenticado"""
        response = self.client.get(self.get_user_info_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "John")

    def test_get_usuario_id_success(self):
        """Obtener el ID del usuario correctamente"""
        response = self.client.get(self.get_usuario_id_url, {"user_id": self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data["usuario_id"]), str(self.usuario.id))

    def test_update_user_profile_success(self):
        """Actualizar perfil del usuario exitosamente"""
        data = {"name": "NewName", "surname": "NewSurname", "phone": "111222333"}
        response = self.client.put(self.update_profile_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "NewName")

    def test_delete_user_account_success(self):
        """Eliminar cuenta de usuario exitosamente"""
        response = self.client.delete(self.delete_account_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_change_password_success(self):
        """Cambiar contraseña exitosamente"""
        data = {"current_password": "testpassword", "new_password": "newsecurepassword"}
        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ## ----------------------------------
    ## ❌ PRUEBAS NEGATIVAS
    ## ----------------------------------

    def test_register_user_invalid_data(self):
        """Intentar registrar usuario con datos inválidos"""
        data = {"username": "", "password": "123", "email": "invalidemail"}
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_credentials(self):
        """Intentar iniciar sesión con credenciales incorrectas"""
        data = {"username": "wronguser", "password": "wrongpassword"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_preferences_invalid_data(self):
        """Intentar actualizar preferencias con datos inválidos"""
        data = {"music": "invalid_data"}  # Debe ser una lista
        response = self.client.patch(self.update_preferences_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_usuario_id_not_found(self):
        """Intentar obtener un usuario inexistente"""
        response = self.client.get(self.get_usuario_id_url, {"user_id": 99999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_user_profile_invalid_data(self):
        """Intentar actualizar perfil con datos inválidos"""
        data = {"email": "invalid-email"}  # No es un email válido
        response = self.client.put(self.update_profile_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_user_account_unauthenticated(self):
        """Intentar eliminar cuenta sin autenticación"""
        self.client.credentials()  # Remueve el token de autenticación
        response = self.client.delete(self.delete_account_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_wrong_current_password(self):
        """Intentar cambiar contraseña con la contraseña actual incorrecta"""
        data = {"current_password": "wrongpassword", "new_password": "newpassword"}
        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_invalid_data(self):
        """Intentar cambiar contraseña sin proporcionar ambos valores"""
        data = {"current_password": "testpassword"}  # Falta la nueva contraseña
        response = self.client.post(self.change_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
