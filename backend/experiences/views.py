from django.http import Http404, HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from backend.experiences.forms import UserPreferencesForm
from experiences.models import Experience
from experiences.serializers import ExperienceSerializer
from users.models import Usuario
from bookings.models import Booking
from bookings.serializers import CrearReservaSerializer, ReservaSerializer


# Create your views here.


def user_preferences(request):
    if not request.user.is_authenticated:
        return HttpResponseForbidden("No tienes permiso para acceder a esta página.")
    
    formulario = UserPreferencesForm()
    user = get_object_or_404(Usuario, user=request.user)

    if request.method=='POST':
        formulario = UserPreferencesForm(request.POST)

        if formulario.is_valid():
            user.adventure = formulario.cleaned_data['adventure']
            user.culture = formulario.cleaned_data['culture']
            user.sports = formulario.cleaned_data['sports']
            user.gastronomy = formulario.cleaned_data['gastronomy']
            user.nightlife = formulario.cleaned_data['nightlife']
            user.music = formulario.cleaned_data['music']
            user.save()

            return redirect('')
    
    return render(request, 'user_preferences.html', {'formulario': formulario})

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
@permission_classes([IsAuthenticated])
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
