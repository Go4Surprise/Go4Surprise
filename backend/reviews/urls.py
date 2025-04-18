from django.urls import path
from .views import post, getAll, getByExperience, getByUser, getLatestTen

urlpatterns = [
    path('create/', post, name="create review"),
    path('getAll/', getAll, name="get all reviews"),
    path('getLatestTen/', getLatestTen, name="get latest ten reviews"),
    path('getByUser/<uuid:user_id>/', getByUser, name="get user reviews"),
    path('getByExperience/<uuid:experience_id>/', getByExperience, name="get experience reviews"),
]
