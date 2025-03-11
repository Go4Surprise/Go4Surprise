from django.urls import path

from reservas.views import crear_reserva, obtener_reserva

urlpatterns = [
    path('crear-reserva/', crear_reserva, name='crear_reserva'),
    path('obtener-reserva/<uuid:id>/', obtener_reserva, name='obtener_reserva'),
]