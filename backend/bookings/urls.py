from django.urls import path

from bookings.views import crear_reserva, obtener_reserva, obtener_reservas_usuario

urlpatterns = [
    path('crear-reserva/', crear_reserva, name='crear_reserva'),
    path('obtener-reserva/<uuid:id>/', obtener_reserva, name='obtener_reserva'),
    path('users/<uuid:user_id>/', obtener_reservas_usuario, name='obtener_reservas_usuario'),
]