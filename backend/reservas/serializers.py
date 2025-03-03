import uuid
from rest_framework import serializers

from users.models import Usuario
from .models import reserva
from datetime import date

class CrearReservaSerializer(serializers.ModelSerializer):
    date = serializers.DateField(required=True)
    momento = serializers.ChoiceField(choices=reserva.Momento.choices, required=True)
    categoria = serializers.ChoiceField(choices=reserva.Categorias.choices,required=True)
    asistentes = serializers.IntegerField(required=True)
    ubicacion = serializers.CharField(required=True)
    coste_por_persona = serializers.FloatField(required=True)
    usuario =  serializers.UUIDField(required=False)

    class Meta:
        model = reserva
        fields = ['date', 'momento', 'categoria', 'asistentes', 'ubicacion', 'coste_por_persona', 'usuario']
    
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
                return reserva.objects.create(usuario=usuario, **validated_data)
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("User not found")
        else:
            return reserva.objects.create(**validated_data)

class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = reserva
        fields = '__all__'
