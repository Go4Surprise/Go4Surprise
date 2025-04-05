from django.conf import settings
from rest_framework import serializers

from bookings.models import Booking
from experiences.models import Experience
from users.models import Usuario
from .models import Reviews


class CreateReviewSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)  # 👈 Agregar explícitamente el campo id

    class Meta:
        model = Reviews
        fields = ["id","puntuacion", "comentario", "user", "experience"]

    def create(self, validated_data):
        """Método para asegurarse de que se devuelve la instancia con el ID"""
        review = Reviews.objects.create(**validated_data)
        return review  # 👈 Devolver la instancia guardada
    
    def validate_puntuacion(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError("La puntuación ha de estar entre 0 y 5")
        return value

    def validate(self, data):
        user_id = data.get("user").id
        experience_id = data.get("experience").id

        if not Usuario.objects.filter(id=user_id).exists():
            raise serializers.ValidationError("El usuario seleccionado no existe")

        if not Experience.objects.filter(id=experience_id).exists():
            raise serializers.ValidationError("La experiencia seleccionada no existe")

        return data


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    user_picture = serializers.SerializerMethodField()
    class Meta:
        model = Reviews
        fields = "__all__"

    def get_user_name(self, obj):
        name = obj.user.name if hasattr(obj.user, 'name') else obj.user.username
        surname = obj.user.surname if hasattr(obj.user, 'surname') else None
        return f"{name} {surname}" if surname else name
    
    def get_booking_date(self, obj):
        try:
            booking = Booking.objects.filter(
                user=obj.user,
                experience=obj.experience
            ).first()
            
            if booking:
                return booking.booking_date
            return None
        except Exception:
            return None
    
    def get_user_picture(self, obj):
        request = self.context.get('request')
        if obj.user.pfp:
            # When using GCS, the URL will be a complete URL rather than a relative path
            if settings.USE_GCS == 'True':
                return obj.user.pfp.url
            # For local storage, build the absolute URI
            elif request is not None:
                return request.build_absolute_uri(obj.user.pfp.url)
            return obj.user.pfp.url
        return None
