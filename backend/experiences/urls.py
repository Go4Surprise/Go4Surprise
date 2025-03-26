from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:experience_id>/update/', views.update_experience, name='update_experience'),
    path('list/', views.list_experiences, name='list_experiences'),
]