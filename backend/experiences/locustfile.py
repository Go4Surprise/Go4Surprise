from locust import HttpUser, task, between
import random
import uuid

class ExperienceLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"  # Configura la URL base

    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODM5MzUzLCJpYXQiOjE3NDQyMzkzNTMsImp0aSI6ImJmZTQ0YTc0ODg1MzRhYWNiZGFkOTdhNGFjZTVhNTM2IiwidXNlcl9pZCI6MX0.34oXR48hx_liPeUnKRRYsVWgWa8EIxjKr2m2E_d0bww"

    experience_ids = [
        "17504b79-7230-40fc-903b-0a203069440e",
        "a41d9800-9dd1-4615-a7ed-b096cc3aa8e5",
        "972f77b1-64b4-4270-b30a-64b6b1635239",
    ]

    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.token}" if self.token else "",
            "Content-Type": "application/json",
        }

    @task
    def list_experiences(self):
        """Prueba la URL para listar experiencias."""
        self.client.get("/experiences/list/", headers=self.get_headers())

    @task
    def update_experience(self):
        """Prueba la URL para actualizar una experiencia."""
        experience_id = random.choice(self.experience_ids)
        data = {
            "location": "Barcelona",
            "time_preference": "AFTERNOON",
            "categories": ["ADVENTURE"],
            "hint": "Una pista interesante",
            "price": 150.0,
            "title": "Nueva experiencia en Barcelona",
            "description": "Disfruta de una experiencia única en la ciudad.",
            "link": "https://example.com/experiencia",
            "notas_adicionales": "Traer ropa cómoda y calzado adecuado.",
        }
        self.client.put(f"/experiences/{experience_id}/update/", json=data, headers=self.get_headers())
