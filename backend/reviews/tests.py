import json
import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from users.models import Usuario
from experiences.models import Experience
from reviews.models import Reviews
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.contrib.auth.models import User

@pytest.fixture
def api_client_with_token(create_user):
    client = APIClient()
    refresh = RefreshToken.for_user(create_user.user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client

@pytest.fixture
def create_user(transactional_db):
    User.objects.filter(username='testuser').delete()
    user = User.objects.create_user(username='testuser', password='testpass')
    Usuario.objects.filter(user=user).delete()
    usuario = Usuario.objects.create(user=user, name='Test', surname='User', email='testuser@example.com')
    return usuario

@pytest.fixture
def create_experience():
    return Experience.objects.create(
        title='Experiencia Test',
        description='Una experiencia de prueba',
        price=50.0,
        location='Madrid',
        time_preference='MORNING',
        categories=["ADVENTURE", "CULTURE"],
        notas_adicionales='Preferencia en zona centro'
    )

@pytest.mark.django_db
def test_post_review_happy_path(api_client_with_token, create_user, create_experience):
    data = {
        'puntuacion': 4.5,
        'comentario': 'Excelente experiencia',
        'user': create_user.id,
        'experience': create_experience.id,
        'media_files': []
    }

    response = api_client_with_token.post(
        reverse('create review'),
        data=data
    )
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_post_review_invalid_score(api_client_with_token, create_user, create_experience):
    data = {
        'puntuacion': 6.0,
        'comentario': 'Puntuación fuera de rango',
        'user': create_user.id,
        'experience': create_experience.id
    }

    response = api_client_with_token.post(
        reverse('create review'),
        data=data
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_get_all_reviews(api_client_with_token, create_user, create_experience):
    Reviews.objects.create(puntuacion=4.0, comentario='Good', user=create_user, experience=create_experience)
    response = api_client_with_token.get(reverse('get all reviews'))
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_reviews_by_user_happy_path(api_client_with_token, create_user, create_experience):
    Reviews.objects.create(puntuacion=4.0, comentario='Good', user=create_user, experience=create_experience)
    response = api_client_with_token.get(reverse('get user reviews', args=[str(create_user.id)]))
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_reviews_by_user_not_found(api_client_with_token):
    fake_id = uuid.uuid4()
    response = api_client_with_token.get(reverse('get user reviews', args=[str(fake_id)]))
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_get_reviews_by_experience_happy_path(api_client_with_token, create_experience, create_user):
    Reviews.objects.create(puntuacion=5.0, comentario='Great!', experience=create_experience, user=create_user)
    response = api_client_with_token.get(reverse('get experience reviews', args=[str(create_experience.id)]))
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_reviews_by_experience_not_found(api_client_with_token):
    fake_id = uuid.uuid4()
    response = api_client_with_token.get(reverse('get experience reviews', args=[str(fake_id)]))
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_get_latest_ten_reviews(api_client_with_token, create_user, create_experience):
    """
    Crea 12 reviews relacionadas con una experiencia real y válidas para la lógica del backend.
    """
    from bookings.models import Booking
    from datetime import date

    # Creamos 12 reservas confirmadas para asociar reviews a algo más realista
    for i in range(12):
        booking = Booking.objects.create(
            user=create_user,
            experience=create_experience,
            experience_date=date.today(),
            booking_date=date.today(),
            cancellable=True,
            status="CONFIRMED",
            participants=1,
            price=50.0,
            total_price=50.0,
            payment_intent_id=f"pi_test_{i}"
        )
        Reviews.objects.create(
            puntuacion=5.0,
            comentario=f'Reseña {i}',
            user=create_user,
            experience=create_experience
        )

    response = api_client_with_token.get(reverse('get latest ten reviews'))
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert len(response.data) == 10

