from django.urls import path

from bookings.views import crear_reserva, obtener_reserva, obtener_reservas_usuario, obtener_reservas_pasadas_usuario, iniciar_pago, stripe_webhook

urlpatterns = [
    path('crear-reserva/', crear_reserva, name='crear_reserva'),
    path('obtener-reserva/<uuid:id>/', obtener_reserva, name='obtener_reserva'),
    path('users/<uuid:user_id>/', obtener_reservas_usuario, name='obtener_reservas_usuario'),
    path('user_past_bookings/<user_id>/', obtener_reservas_pasadas_usuario, name='obtener_reservas_pasadas_usuario'),
    path('iniciar-pago/<booking_id>/', iniciar_pago, name='iniciar_pago'),
    path('stripe-webhook/', stripe_webhook, name='stripe_webhook'),
]