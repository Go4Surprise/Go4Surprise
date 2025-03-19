import uuid
from rest_framework import serializers

from experiences.models import Experience
from users.models import Usuario
from .models import Booking
from django.utils import timezone
from experiences.serializers import ExperienceSerializer
from datetime import datetime, timedelta

class CrearReservaSerializer(serializers.ModelSerializer):
    participants= serializers.IntegerField(required=True)
    price = serializers.FloatField(required=True)
    user =  serializers.UUIDField(required=True)
    experience_date = serializers.DateField(required=True)

    # Atributos de la experiencia
    location = serializers.CharField(required=True)
    duration = serializers.IntegerField(required=True)
    category = serializers.ChoiceField(choices=Experience.ExperienceCategory.choices,required=True)

    class Meta:
        model = Booking
        fields = ['participants', 'price', 'user', 'experience_date', 'location', 'duration', 'category']
        
    def validate_user(self, value):
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
        usuario_id = validated_data.pop('user', None)
        if usuario_id:
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                booking_date = timezone.now().date()
                total_price = validated_data['price'] * validated_data['participants']
                
                # Crea la experiencia si no existe ninguna para la localización, duración, categoría y precio
                # Si ya existe, la asocia a la reserva
                experience, created = Experience.objects.get_or_create(location=validated_data['location'], duration=validated_data['duration'], category=validated_data['category'], price=validated_data['price'])
                
                return Booking.objects.create(
                    experience=experience,
                    user=usuario,
                    status="PENDING",
                    cancellable=True,
                    booking_date=booking_date,
                    experience_date=validated_data['experience_date'],
                    total_price=total_price,
                    price=validated_data['price'],
                    participants=validated_data['participants']
                )
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("User not found")
        else:
            return Booking.objects.create(**validated_data)

class ReservaSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer()
    hint = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'


    def get_experience(self, obj):
        return {"name": obj.experience.name} 
    

    def get_hint(self, obj):
        # Devuelve la pista de la experiencia si faltan 24 horas o menos para la fecha de la experiencia.
        now = timezone.now().date()

        if obj.experience_date - now <= timedelta(days=1):
            return obj.experience.hint or "No hay información adicional disponible."
    
        return None