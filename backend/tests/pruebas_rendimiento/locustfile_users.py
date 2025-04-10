from locust import HttpUser, task, between
import random
import uuid

class UsersLoadTest(HttpUser):
    wait_time = between(1, 3)

    host = "http://localhost:8000"

    token_admin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODgzMTM2LCJpYXQiOjE3NDQyODMxMzYsImp0aSI6IjY3MDUxOGVhNzk2YjQ5ODc4NzM1Zjc5YmMwOGZlNzlkIiwidXNlcl9pZCI6NTI0fQ.TJ7TTj0kq1GjM2lhYR7BdrcLz9W0qZTCqTr6J9Ht2iI"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODg0NjIxLCJpYXQiOjE3NDQyODQ2MjEsImp0aSI6IjZlODM3NjQzMTk2NDQzN2Q5MjZkZmFkYmY0NTkwYzhlIiwidXNlcl9pZCI6NTI3fQ.4s2kV0m2t8snSJi0_psH30OKUY5W6Uv6Ehbqhxf4c_I"

    user_ids = [
        "f7382551-69c4-4b71-a325-bf2ad1957bf4",
    ]
    user_ids_admin = [
        "629b8d53-bbf8-495d-9685-fffe9eb5a3f5",
    ]

    random_username = f"user_{uuid.uuid4().hex[:8]}"

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

    """ @task
    def delete_user_account(self):
        self.client.delete("/users/delete/", headers=null) """

    @task
    def login_user(self):
        """Prueba la URL para iniciar sesión."""
        data = {
            "username": "prueba-josema",
            "password": "contraseña"
        }

        headers = self.get_headers().copy()
        headers.pop("Authorization", None)

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

    @task
    def change_password(self):
        """Prueba la URL para cambiar la contraseña."""
        data = {
            "current_password": "contraseña",
            "new_password": "contraseña",
        }
        self.client.post("/users/change_password/", json=data, headers=self.get_headers())


    @task
    def check_username_exists(self):
        """Prueba la URL para verificar si un nombre de usuario existe."""
        username = "prueba-josema"
        self.client.get(f"/users/check_username/{username}/", headers=self.get_headers())


    # ------------------TESTS ADMIN---------------------------------------------------------------------


    @task
    def admin_list_users(self):
        """Prueba la URL para listar usuarios (admin)."""
        self.client.get("/users/admin/list/", headers=self.get_headers_admin())


    @task
    def admin_user_detail(self):
        """Prueba la URL para obtener detalles de un usuario (admin)."""
        user_id = 3
        self.client.get(f"/users/admin/detail/{user_id}/", headers=self.get_headers_admin())


    @task
    def admin_update_user(self):
        """Prueba la URL para actualizar un usuario (admin)."""
        user_id = 3
        data = {
            "is_active": True,
            "is_staff": False,
            "is_superuser": False,
            "name": "Juan",
            "surname": "Pérez",
            "phone": "123456789"
        }
        self.client.put(f"/users/admin/update/{user_id}/", json=data, headers=self.get_headers_admin())

""" 
    @task
    def admin_delete_user(self):
        user_id = random.choice(self.user_ids)
        self.client.delete(f"/users/admin/delete/{user_id}/", headers=self.get_headers()) """
