from django.urls import path, include
from .views import register_user, login_user, update_preferences, get_usuario_id
from .views import get_user_info, register_user, login_user, update_preferences, update_user_profile, delete_user_account, change_password
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('preferences/', update_preferences, name='update-preferences'),
    path('get-usuario-id/', get_usuario_id, name='get-usuario-id'),
    path('get_user_info/', get_user_info, name='get-user-info'),
    path('update/', update_user_profile, name='update_user_profile'),
    path('delete/', delete_user_account, name='delete_user_account'),
    path('change_password/', change_password, name='change_password'),

    # reset password urls
    path('api/auth/', include('dj_rest_auth.urls')),  
    path('api/auth/password/reset/', include('dj_rest_auth.registration.urls')),

]
