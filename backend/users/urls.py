from django.urls import include, path

from .admin import admin_user_delete, admin_user_detail, admin_user_list, admin_user_update
from .views import register_user, login_user, update_preferences, get_usuario_id, check_username_exists
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
    path('check_username/<str:username>/', check_username_exists, name='check_username'),

    # reset password urls
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

    # Admin routes
    path('admin/list/', admin_user_list, name='admin_user_list'),
    path('admin/detail/<int:pk>/', admin_user_detail, name='admin_user_detail'),
    path('admin/update/<int:pk>/', admin_user_update, name='admin_user_update'),
    path('admin/delete/<int:pk>/', admin_user_delete, name='admin_user_delete'),
]
