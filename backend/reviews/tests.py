from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from model_bakery import baker
from users.models import Usuario
from experiences.models import Experience
from reviews.models import Reviews
from django.contrib.auth.models import User
import uuid

class ReviewsTestCase(TestCase):
    def setUp(self):
        """Configura los objetos necesarios para las pruebas"""
        self.client = APIClient()

        # Crear un usuario de Django y asociarlo con un Usuario en la BD
        self.user = User.objects.create_user(username="testuser", password="testpassword")
        self.usuario = baker.make(Usuario, user=self.user)

        # Crear una experiencia ficticia
        self.experience = baker.make(Experience)

        # Crear una reseña asociada al usuario y la experiencia
        self.review = baker.make(Reviews, user=self.usuario, experience=self.experience, puntuacion=4.5, comentario="Muy buena experiencia")

        # Autenticación del usuario en los tests protegidos
        self.client.force_authenticate(user=self.user)

    # ✅ ✅ ✅  PRUEBAS POSITIVAS ✅ ✅ ✅ 

    def test_crear_review_exitosa(self):
        """Prueba la creación exitosa de una reseña"""
        url = reverse("create review")
        data = {
            "puntuacion": 5,
            "comentario": "Increíble experiencia",
            "user": self.usuario.id,
            "experience": self.experience.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)

    def test_obtener_todas_las_reviews(self):
        """Prueba la obtención de todas las reseñas"""
        url = reverse("get all reviews")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)  # Al menos una reseña

    def test_obtener_reviews_por_usuario(self):
        """Prueba la obtención de reseñas de un usuario específico"""
        url = reverse("get user reviews", kwargs={"user_id": self.usuario.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_obtener_reviews_por_experiencia(self):
        """Prueba la obtención de reseñas de una experiencia específica"""
        url = reverse("get experience reviews", kwargs={"experience_id": self.experience.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    # ❌ ❌ ❌ PRUEBAS NEGATIVAS ❌ ❌ ❌ 

    def test_crear_review_puntuacion_invalida(self):
        """Prueba la creación de una reseña con puntuación fuera de rango"""
        url = reverse("create review")
        data = {
            "puntuacion": 6,  # ⚠️ Fuera del rango permitido (0-5)
            "comentario": "Mala experiencia",
            "user": self.usuario.id,
            "experience": self.experience.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("puntuacion", response.data)

    def test_crear_review_sin_comentario(self):
        """Prueba la creación de una reseña sin comentario"""
        url = reverse("create review")
        data = {
            "puntuacion": 4,
            "user": self.usuario.id,
            "experience": self.experience.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("comentario", response.data)

    def test_crear_review_usuario_no_existente(self):
        """Prueba la creación de una reseña con un usuario inexistente"""
        url = reverse("create review")
        fake_uuid = uuid.uuid4()
        data = {
            "puntuacion": 3,
            "comentario": "No está mal",
            "user": fake_uuid,
            "experience": self.experience.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user", response.data)

    def test_crear_review_experience_no_existente(self):
        """Prueba la creación de una reseña con una experiencia inexistente"""
        url = reverse("create review")
        fake_uuid = uuid.uuid4()
        data = {
            "puntuacion": 2,
            "comentario": "Horrible",
            "user": self.usuario.id,
            "experience": fake_uuid,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("experience", response.data)

    def test_obtener_reviews_usuario_inexistente(self):
        """Prueba la obtención de reseñas de un usuario inexistente"""
        fake_uuid = uuid.uuid4()
        url = reverse("get user reviews", kwargs={"user_id": fake_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_obtener_reviews_experience_inexistente(self):
        """Prueba la obtención de reseñas de una experiencia inexistente"""
        fake_uuid = uuid.uuid4()
        url = reverse("get experience reviews", kwargs={"experience_id": fake_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_obtener_reviews_falla_servidor(self):
        """Prueba que la API maneja correctamente un fallo inesperado en la vista"""
        # Sobreescribir la función `objects.all` para simular un fallo en la BD
        def fake_all():
            raise Exception("Error del servidor simulado")

        original_all = Reviews.objects.all
        Reviews.objects.all = fake_all  # Simular error en la consulta

        url = reverse("get all reviews")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

        # Restaurar el comportamiento original
        Reviews.objects.all = original_all
