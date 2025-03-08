from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import CreateReviewSerializer, ReviewSerializer
from .models import Reviews
from users.models import Usuario
from experiences.models import Experience


@swagger_auto_schema(
    method="post",
    operation_description="Crear una nueva reseña para una experiencia",
    request_body=CreateReviewSerializer,
    responses={
        201: CreateReviewSerializer(),
        400: openapi.Response("Error de validación", CreateReviewSerializer),
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def post(request):
    serializer = CreateReviewSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response(
            description="Lista de todas las reseñas",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT)
            )
        ),
        500: openapi.Response(description="Error del servidor")
    }
)
@api_view(["GET"])
def getAll(request):
    try:
        reviews = Reviews.objects.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            'user_id',
            openapi.IN_PATH,
            description="ID del usuario",
            type=openapi.TYPE_STRING,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="Lista de reseñas del usuario",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT)
            )
        ),
        404: openapi.Response(description="No se encontró ningún usuario con este ID"),
        500: openapi.Response(description="Error del servidor")
    }
)
@api_view(["GET"])
def getByUser(request, user_id):
    try:
        usuarios = Usuario.objects.get(id=user_id)
        reviews = Reviews.objects.filter(user=usuarios)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except Usuario.DoesNotExist:
        return Response(
            {"error": f"No se encontró ningún usuario con este ID"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@swagger_auto_schema(
    method='get',
    manual_parameters=[
        openapi.Parameter(
            'experience_id',
            openapi.IN_PATH,
            description="ID de la experiencia",
            type=openapi.TYPE_STRING,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="Lista de reseñas de la experiencia",
            schema=openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT)
            )
        ),
        404: openapi.Response(description="No se encontró ninguna experiencia con este ID"),
        500: openapi.Response(description="Error del servidor")
    }
)
@api_view(["GET"])
def getByExperience(request, experience_id):
    try:
        experiences = Experience.objects.get(id=experience_id)
        reviews = Reviews.objects.filter(experience=experiences)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except Experience.DoesNotExist:
        return Response(
            {"error": f"No se encontró ninguna experiencia con este ID"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"error": f"Error del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
