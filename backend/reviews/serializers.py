from rest_framework import serializers

from experiences.models import Experience
from users.models import Usuario
from .models import Reviews

class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reviews
        fields = ['puntuacion', 'comentario', 'user', 'experience']
        
    def validate_puntuacion(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError("La puntuación ha de estar entre 0 y 5")
        return value
    
    def validate(self, data):
        user_id = data.get('user').id
        experience_id = data.get('experience').id
        
        if not Usuario.objects.filter(id=user_id).exists():
            raise serializers.ValidationError("El usuario seleccionado no existe")
        
        if not Experience.objects.filter(id=experience_id).exists():
            raise serializers.ValidationError("La experiencia seleccionada no existe")
        
        return data