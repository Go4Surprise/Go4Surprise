from django.http import Http404, HttpResponseForbidden
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAdminUser

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from experiences.models import Experience
from experiences.serializers import ExperienceSerializer
from users.models import Usuario
from bookings.models import Booking
from bookings.serializers import CrearReservaSerializer, ReservaSerializer


# Create your views here.

@swagger_auto_schema(
    method='put',
    request_body=ExperienceSerializer,
    operation_id="update_experience",
    operation_description="Actualiza una experiencia una vez se haya encontrado un evento correspondiente",
    responses={
        200: ExperienceSerializer,
        400: "Bad Request",
        404: "Not Found",
        500: "Internal Server Error"
    },
    tags=['Experience']
)
@api_view(['PUT'])
@parser_classes([FormParser, MultiPartParser, JSONParser])
@permission_classes([IsAdminUser])
def update_experience(request, experience_id):
    """
    Actualiza una experiencia una vez se haya encontrado un evento correspondiente
    """
    try:
        experience = get_object_or_404(Experience, id=experience_id)
        
        serializer = ExperienceSerializer(experience, data=request.data, partial=True)
        if serializer.is_valid():
            updated_experience = serializer.save()
            return Response(ExperienceSerializer(updated_experience).data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        return Response(
            {"error": "Experience not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_experiences(request):
    """
    List all experiences
    """
    try:
        experiences = Experience.objects.all()
        serializer = ExperienceSerializer(experiences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
