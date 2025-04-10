from locust import HttpUser, task, between
import random
import uuid

class ReviewsLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"  # Configura la URL base

    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODQxMTE2LCJpYXQiOjE3NDQyNDExMTYsImp0aSI6Ijg0ZDY1ZjVhM2EwODQ0MWZiOTg0ZDU1ZjExNDU1OGY4IiwidXNlcl9pZCI6MX0.cOxReKeXhNdy9NMWNYVAE991Ra6n2ptflshvVslSEag"

    experience_ids = [
        "17504b79-7230-40fc-903b-0a203069440e",
        "a41d9800-9dd1-4615-a7ed-b096cc3aa8e5",
        "972f77b1-64b4-4270-b30a-64b6b1635239",
    ]
    user_ids = [
        "af31f636-6313-42d2-a424-dd4ed95ae384",
    ]

    def get_headers(self):
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
            "user": "af31f636-6313-42d2-a424-dd4ed95ae384",
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
