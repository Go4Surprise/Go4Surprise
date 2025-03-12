from django.urls import path
from .views import get_user_info, register_user, login_user, update_preferences

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('preferences/', update_preferences, name='update-preferences'),
    path('get_user_info/', get_user_info, name='get-user-info'),
]
