from django.urls import path
from .views import register_user, login_user, update_preferences, get_usuario_id

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('preferences/', update_preferences, name='update-preferences'),
    path('get-usuario-id/', get_usuario_id, name='get-usuario-id'),
]
