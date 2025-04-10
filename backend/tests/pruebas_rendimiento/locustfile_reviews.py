from locust import HttpUser, task, between
import random
import uuid

class ReviewsLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"  # Configura la URL base

    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODgzMTM2LCJpYXQiOjE3NDQyODMxMzYsImp0aSI6IjY3MDUxOGVhNzk2YjQ5ODc4NzM1Zjc5YmMwOGZlNzlkIiwidXNlcl9pZCI6NTI0fQ.TJ7TTj0kq1GjM2lhYR7BdrcLz9W0qZTCqTr6J9Ht2iI"
    refresh_token_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0NDM2OTUzNiwiaWF0IjoxNzQ0MjgzMTM2LCJqdGkiOiJlNmQ4NDIzOThjNzM0MjU5YjMzMzkyNGE4M2ZjZjgxOSIsInVzZXJfaWQiOjUyNH0.-T1CJYbBHw0EnCbXUhS11HrL52KR-WBv2pyR2DfT7MY"

    experience_ids = [
        "17504b79-7230-40fc-903b-0a203069440e",
        "a41d9800-9dd1-4615-a7ed-b096cc3aa8e5",
        "972f77b1-64b4-4270-b30a-64b6b1635239",
    ]
    user_ids = [
        "629b8d53-bbf8-495d-9685-fffe9eb5a3f5",
    ]

    def refresh_token(self):
        """Renueva el token de acceso utilizando el refresh token."""
        response = self.client.post(
            "/auth/token/refresh/",
            json={"refresh": self.refresh_token_value},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            self.token = response.json().get("access")
        else:
            print(f"Error al renovar el token: {response.status_code} - {response.text}")

    def get_headers(self):
        """Obtiene los encabezados con el token actualizado."""
        if not self.token:
            self.refresh_token()
        return {
            "Authorization": f"Bearer {self.token}" if self.token else "",
            "Content-Type": "application/json",
        }

    @task
    def create_review(self):
        """Prueba la URL para crear una reseña con multipart/form-data."""
        data = {
            "puntuacion": "5",
            "comentario": "Una experiencia increíble, ¡muy recomendada!",
            "user": "629b8d53-bbf8-495d-9685-fffe9eb5a3f5",
            "experience": "17504b79-7230-40fc-903b-0a203069440e"
        }

        headers = self.get_headers().copy()
        headers.pop("Content-Type", None)

        self.client.post("/reviews/create/", data=data, headers=headers)


    @task
    def get_all_reviews(self):
        """Prueba la URL para obtener todas las reseñas."""
        self.client.get("/reviews/getAll/", headers=self.get_headers())

    @task
    def get_latest_ten_reviews(self):
        """Prueba la URL para obtener las últimas diez reseñas."""
        self.client.get("/reviews/getLatestTen/", headers=self.get_headers())

    @task
    def get_reviews_by_user(self):
        """Prueba la URL para obtener las reseñas de un usuario específico."""
        user_id = random.choice(self.user_ids)
        self.client.get(f"/reviews/getByUser/{user_id}/", headers=self.get_headers())

    @task
    def get_reviews_by_experience(self):
        """Prueba la URL para obtener las reseñas de una experiencia específica."""
        experience_id = random.choice(self.experience_ids)
        self.client.get(f"/reviews/getByExperience/{experience_id}/", headers=self.get_headers())
