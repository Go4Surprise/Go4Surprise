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
    experience_hint = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['id', 'participants', 'total_price', 'experience_date', 'cancellable', 'status', 'user', 'experience',
                  'experience_hint']

    def get_experience_hint(self, obj):
        # Devuelve la pista de la experiencia si faltan 48 horas o menos para la fecha de la experiencia.
        now = timezone.now().date()

        if obj.experience_date - now <= timedelta(days=2):
            return obj.experience.hint or "No hay ninguna pista para esta experiencia."
    
        return None
    

class AdminBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'


class AdminBookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Booking model from admin panel"""

    participants = serializers.IntegerField(required=False)
    price = serializers.FloatField(write_only=True, required=False)
    booking_date = serializers.DateField(write_only=True, required=False)
    experience_date = serializers.DateField(required=False)
    cancellable = serializers.BooleanField(required=False)
    status = serializers.ChoiceField(
        choices=['PENDING', 'CANCELLED', 'CONFIRMED'],
        required=False
    )

    class Meta:
        model = Booking
        fields = '__all__'

    def validate(self, data):
        if len(data) == 0:
            raise serializers.ValidationError("No hay ningún campo para actualizar.")
        return data

    def update(self, instance, validated_data):
        participants = validated_data.pop('participants', None)
        price = validated_data.pop('price', None)
        booking_date = validated_data.pop('booking_date', None)
        experience_date = validated_data.pop('experience_date', None)
        cancellable = validated_data.pop('cancellable', None)
        status = validated_data.pop('status', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Removed erroneous block that accessed instance.booking
        if participants is not None:
            instance.participants = participants
        if price is not None:
            instance.price = price
        if booking_date is not None:
            instance.booking_date = booking_date
        if experience_date is not None: 
            instance.experience_date = experience_date
        if cancellable is not None:
            instance.cancellable = cancellable
        if status is not None:
            instance.status = status

        instance.save()
        return instance