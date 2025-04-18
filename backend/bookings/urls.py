from django.urls import path

from bookings.views import crear_reserva, obtener_reserva, obtener_reservas_usuario, obtener_reservas_pasadas_usuario, iniciar_pago, send_scheduled_notifications, stripe_webhook, actualizar_estado_reserva, cancelar_reserva
from bookings.admin import admin_booking_list, admin_booking_update, admin_booking_detail, admin_booking_delete

urlpatterns = [
    path('crear-reserva/', crear_reserva, name='crear_reserva'),
    path('obtener-reserva/<uuid:id>/', obtener_reserva, name='obtener_reserva'),
    path('users/<uuid:user_id>/', obtener_reservas_usuario, name='obtener_reservas_usuario'),
    path('user_past_bookings/<uuid:user_id>/', obtener_reservas_pasadas_usuario, name='obtener_reservas_pasadas_usuario'),
    path('admin/list/', admin_booking_list, name='admin_booking_list'),
    path('admin/detail/<uuid:pk>/', admin_booking_detail, name='admin_booking_detail'),
    path('admin/update/<uuid:pk>/', admin_booking_update, name='admin_booking_update'),
    path('admin/delete/<uuid:pk>/', admin_booking_delete, name='admin_booking_delete'),
    path('admin/update-status/<uuid:id>/', actualizar_estado_reserva, name='actualizar_estado_reserva'),
    path('iniciar-pago/<booking_id>/', iniciar_pago, name='iniciar_pago'),
    path('stripe-webhook/', stripe_webhook, name='stripe_webhook'),
    path('cancel/<uuid:id>/', cancelar_reserva, name='cancelar_reserva'),

    path('send-scheduled-notifications/', send_scheduled_notifications, name='send_scheduled_notifications')
]