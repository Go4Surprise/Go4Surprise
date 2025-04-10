from locust import HttpUser, task, between
import random
import uuid

class UsersLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"

    token_admin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODM5MzUzLCJpYXQiOjE3NDQyMzkzNTMsImp0aSI6ImJmZTQ0YTc0ODg1MzRhYWNiZGFkOTdhNGFjZTVhNTM2IiwidXNlcl9pZCI6MX0.34oXR48hx_liPeUnKRRYsVWgWa8EIxjKr2m2E_d0bww"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODQ0MzUxLCJpYXQiOjE3NDQyNDQzNTEsImp0aSI6ImUyNWU1MDZlMjMzMzQxODY5ODMzOTU0MDJhODk1YmNmIiwidXNlcl9pZCI6ODh9.6tcO4d2i9HS7e6lsS1yu_jUY_vSdU0riTog7HkYrmMo"

    User_ids = [
        "aae781ef-cd13-4efc-98fd-805403ddf44a",
    ]
    user_ids_admin = [
        "af31f636-6313-42d2-a424-dd4ed95ae384",
    ]

    random_username = f"user_{uuid.uuid4().hex[:8]}"  # Genera un username aleatorio

    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.token}" if self.token else "",
            "Content-Type": "application/json",
        }
    
    def get_headers_admin(self):
        return {
            "Authorization": f"Bearer {self.token_admin}" if self.token_admin else "",
            "Content-Type": "application/json",
        }

    """ @task
    def register_user(self):
        random_username = f"user_{uuid.uuid4().hex[:8]}"
        data = {
            "birthdate": "2003-11-07",
            "username": random_username,
            "name": "Test",
            "surname": "Test",
            "email": f"{random_username}@testmail.com",
            "phone": "606456789",
            "password": random_username
        }

        headers = self.get_headers().copy()
        headers.pop("Authorization", None)

        self.client.post("/users/register/", json=data, headers=headers) """

    @task
    def login_user(self):
        """Prueba la URL para iniciar sesión."""
        data = {
            "username": "test1",
            "password": "test1test1"
        }

        headers = self.get_headers().copy()
        headers.pop("Authorization", None)  # Elimina el encabezado Authorization

        self.client.post("/users/login/", json=data, headers=headers)

    @task
    def update_preferences(self):
        """Prueba la URL para actualizar preferencias."""
        
        data = {
            "music": ["🚫 Nada en especial"],
            "culture":  ["🚫 Nada en especial"],
            "sports": ["🚫 Nada en especial"],
            "gastronomy": ["🚫 Nada en especial"],
            "nightlife": ["🚫 Nada en especial"],
            "adventure": ["🚫 Nada en especial"]
        }

        self.client.patch("/users/preferences/", json=data, headers=self.get_headers())

    @task
    def get_user_info(self):
        """Prueba la URL para obtener información del usuario."""
        self.client.get("/users/get_user_info/", headers=self.get_headers())

    @task
    def update_user_profile(self):
        """Prueba la URL para actualizar el perfil del usuario."""
        data = {
            "name": "Updated Name",
            "phone": "606006600"
        }

        headers = self.get_headers().copy()
        headers.pop("Content-Type", None)

        self.client.put("/users/update/", data=data, headers=headers)

    """ @task
    def delete_user_account(self):
        self.client.delete("/users/delete/", headers=self.get_headers()) """

