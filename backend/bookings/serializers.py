import uuid
from rest_framework import serializers

from users.models import Usuario
from .models import Booking
from datetime import date

class CrearReservaSerializer(serializers.ModelSerializer):
    date = serializers.DateField(required=True)
    participants= serializers.IntegerField(required=True)
    total_price = serializers.FloatField(required=True)
    user =  serializers.UUIDField(required=False)
    experience = serializers.UUIDField(required=True)

    class Meta:
        model = Booking
        fields = ['date', 'participants', 'total_price', 'user', 'experience']
        
    def validate_usuario(self, value):
        """
        Comprobar que el UUID es válido y que el usuario existe en BBDD
        """
        try:
            uuid_obj = uuid.UUID(str(value))
            usuario = Usuario.objects.get(id=uuid_obj)
            return usuario.id
        except (ValueError, TypeError):
            raise serializers.ValidationError("Usuario ID debe ser un UUID válido")
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("No se encontró ningún usuario con este ID")
    
    def create(self, validated_data):
        usuario_id = validated_data.pop('usuario', None)
        if usuario_id:
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                return Booking.objects.create(usuario=usuario, **validated_data)
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("User not found")
        else:
            return Booking.objects.create(**validated_data)

class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
