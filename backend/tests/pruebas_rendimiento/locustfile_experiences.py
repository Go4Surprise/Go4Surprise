from locust import HttpUser, task, between
import random
import uuid

class ExperienceLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"  # Configura la URL base

    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODgzMTM2LCJpYXQiOjE3NDQyODMxMzYsImp0aSI6IjY3MDUxOGVhNzk2YjQ5ODc4NzM1Zjc5YmMwOGZlNzlkIiwidXNlcl9pZCI6NTI0fQ.TJ7TTj0kq1GjM2lhYR7BdrcLz9W0qZTCqTr6J9Ht2iI"

    refresh_token_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0NDM2OTUzNiwiaWF0IjoxNzQ0MjgzMTM2LCJqdGkiOiJlNmQ4NDIzOThjNzM0MjU5YjMzMzkyNGE4M2ZjZjgxOSIsInVzZXJfaWQiOjUyNH0.-T1CJYbBHw0EnCbXUhS11HrL52KR-WBv2pyR2DfT7MY"

    experience_ids = [
        "17504b79-7230-40fc-903b-0a203069440e",
        "a41d9800-9dd1-4615-a7ed-b096cc3aa8e5",
        "972f77b1-64b4-4270-b30a-64b6b1635239",
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
