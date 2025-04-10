from sqlite3 import Date
from locust import HttpUser, task, between
import random
import uuid

class BookingAdminLoadTest(HttpUser):
    wait_time = between(1, 3) 

    host = "http://localhost:8000"  # Configura la URL base

    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjo0ODk3ODgzMTM2LCJpYXQiOjE3NDQyODMxMzYsImp0aSI6IjY3MDUxOGVhNzk2YjQ5ODc4NzM1Zjc5YmMwOGZlNzlkIiwidXNlcl9pZCI6NTI0fQ.TJ7TTj0kq1GjM2lhYR7BdrcLz9W0qZTCqTr6J9Ht2iI"

    refresh_token_value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0NDM2OTUzNiwiaWF0IjoxNzQ0MjgzMTM2LCJqdGkiOiJlNmQ4NDIzOThjNzM0MjU5YjMzMzkyNGE4M2ZjZjgxOSIsInVzZXJfaWQiOjUyNH0.-T1CJYbBHw0EnCbXUhS11HrL52KR-WBv2pyR2DfT7MY"

    booking_ids = [
        "77e59ea6-65df-4053-a139-521a260fd3d7",
        "46fae699-2e26-425b-a103-d44875537a56",
        "681485d8-7203-4cb7-bbf8-7c6aefd2ff22",
    ]

    user_ids = [
        "629b8d53-bbf8-495d-9685-fffe9eb5a3f5",
    ]

    created_booking_ids = []

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
    def obtener_reservas_admin(self):
        self.client.get("/bookings/admin/list/", headers=self.get_headers())

    @task
    def obtener_detalle_reserva_admin(self):
        reserva_id = random.choice(self.booking_ids)
        self.client.get(f"/bookings/admin/detail/{reserva_id}/", headers=self.get_headers())

    @task
    def crear_reserva(self):
        data = {
            "participants": 3,
            "price": 60.0, 
            "user": "629b8d53-bbf8-495d-9685-fffe9eb5a3f5",  
            "experience_date": "2024-10-15",  
            "location": "Madrid",  
            "time_preference": "MORNING",  
            "categories": ["ADVENTURE", "MUSIC"],  
            "notas_adicionales": "Por favor, preparar algo especial."
        }
        response = self.client.post(f"/bookings/crear-reserva/", json=data, headers=self.get_headers())
        if response.status_code == 201:  # Verifica que la reserva se creó correctamente
            booking_id = response.json().get("id")  # Obtén el ID de la reserva de la respuesta
            if booking_id:
                self.created_booking_ids.append(booking_id)  # Almacena el ID en la lista

    @task
    def obtener_reservas_usuario(self):
        user_id = random.choice(self.user_ids)
        self.client.get(f"/bookings/users/{user_id}/", headers=self.get_headers())

    @task
    def obtener_reserva(self):
        reserva_id = random.choice(self.booking_ids)
        self.client.get(f"/bookings/obtener-reserva/{reserva_id}/", headers=self.get_headers())

    @task
    def obtener_reservas_pasadas_usuario(self):
        user_id = random.choice(self.user_ids)
        self.client.get(f"/bookings/user_past_bookings/{user_id}/", headers=self.get_headers())

# ------------------TESTS ADMIN---------------------------------------------------------------------

    @task
    def admin_actualizar_reserva(self):
        if self.created_booking_ids:
            reserva_id = random.choice(self.created_booking_ids)
            data = {
                "status": "CONFIRMED",  # Estado de la reserva
                "experience": {
                    "id": "17504b79-7230-40fc-903b-0a203069440e",  # ID de la experiencia
                    "location": "Bilbao",  # Ubicación de la experiencia
                    "time_preference": "AFTERNOON",  # Preferencia de horario
                    "categories": [],  # Categorías de la experiencia
                    "hint": "pista",  # Pista opcional
                    "price": 9999.00,  # Precio de la experiencia
                    "title": "",  # Título de la experiencia
                    "description": "",  # Descripción de la experiencia
                    "link": "",  # Enlace a la experiencia
                    "notas_adicionales": "",  # Notas adicionales
                },
                "experience_date": "2024-12-01",  # Fecha de la experiencia
                "participants": 5,  # Número de participantes
                "total_price": 500.0,  # Precio total calculado
            }
            self.client.put(f"/bookings/admin/update/{reserva_id}/", json=data, headers=self.get_headers())

    @task
    def admin_actualizar_estado_reserva(self):
        if self.created_booking_ids:
            reserva_id = random.choice(self.created_booking_ids)
            data = {
                "status": "CONFIRMED"
            }
            self.client.put(f"/bookings/admin/update-status/{reserva_id}/", json=data, headers=self.get_headers())
           
