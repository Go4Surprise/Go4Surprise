from rest_framework import serializers

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
    class Meta:
        model = Reviews
        fields = "__all__"
