from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import CreateReviewSerializer
@swagger_auto_schema(
        method='post',
        operation_description="Crear una nueva reseña para una experiencia",
        request_body=CreateReviewSerializer,
        responses={
            201: CreateReviewSerializer(),
            400: openapi.Response("Error de validación", CreateReviewSerializer),
        }
    )
@api_view(['POST'])
def post(request):
    serializer = CreateReviewSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status = status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)