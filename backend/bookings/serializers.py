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
    experience = ExperienceSerializer()  # Incluir el serializador de la experiencia

    class Meta:
        model = Booking
        fields = '__all__'


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'name', 'description', 'hint']  # Aquí puedes agregar los campos que necesitas de la experiencia


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
    hint = serializers.CharField(required=False, allow_blank=True)
    duracion = serializers.IntegerField(required=False)
    localizacion = serializers.CharField(required=False)
    categoria = serializers.ChoiceField(choices=Experience.ExperienceCategory.choices, required=False)

    class Meta:
        model = Booking
        fields = ['participants', 'price', 'booking_date', 'experience_date', 'cancellable', 'status', 'hint', 'duracion',
                  'localizacion', 'categoria']

    def validate(self, data):
        if len(data) == 0:
            raise serializers.ValidationError("No hay ningún campo para actualizar.")
        return data

    def update(self, instance, validated_data):
        hint = validated_data.pop('hint', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if hint is not None and instance.experience:
            instance.experience.hint = hint
            instance.experience.save()

        instance.save()
        return instance