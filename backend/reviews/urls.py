from django.urls import path
from .views import post

urlpatterns = [
    path('create/', post, name="create review")
]
