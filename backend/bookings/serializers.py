import uuid
from rest_framework import serializers

from experiences.models import Experience, ExperienceCategory
from users.models import Usuario
from .models import Booking
from django.utils import timezone
from experiences.serializers import ExperienceSerializer
from datetime import timedelta

class CrearReservaSerializer(serializers.ModelSerializer):
    participants= serializers.IntegerField(required=True)
    price = serializers.FloatField(required=True)
    user =  serializers.UUIDField(required=True)
    experience_date = serializers.DateField(required=True)

    # Atributos de la experiencia
    location = serializers.CharField(required=True)
    time_preference = serializers.ChoiceField(
        choices=[
            ('MORNING', 'Mañana'),
            ('AFTERNOON', 'Tarde'),
            ('NIGHT', 'Noche'),
        ],
        required=True
    )
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=ExperienceCategory.choices),
        required=False
    )
    paid = serializers.BooleanField(default=False)

    notas_adicionales = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Booking
        fields = ['participants', 'price', 'user', 'experience_date', 'location', 'time_preference', 'categories', 'notas_adicionales', 'paid']
        
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
        
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser positivo")
        return value
    
    def validate_participants(self, value):
        if value <= 0:
            raise serializers.ValidationError("El número de participantes debe ser positivo")
        return value
    
    def validate_categories(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("No puedes seleccionar más de 3 categorías.")
        return value
    
    def validate(self, data):
        """
        Ensure all required fields are present and valid.
        """
        if not data.get('participants'):
            raise serializers.ValidationError({"participants": "Este campo es obligatorio."})
        if not data.get('price'):
            raise serializers.ValidationError({"price": "Este campo es obligatorio."})
        if not data.get('user'):
            raise serializers.ValidationError({"user": "Este campo es obligatorio."})
        if not data.get('experience_date'):
            raise serializers.ValidationError({"experience_date": "Este campo es obligatorio."})
        if not data.get('location'):
            raise serializers.ValidationError({"location": "Este campo es obligatorio."})
        if not data.get('time_preference'):
            raise serializers.ValidationError({"time_preference": "Este campo es obligatorio."})
        return data
    
    def create(self, validated_data):
        usuario_id = validated_data.pop('user', None)
        if usuario_id:
            try:
                usuario = Usuario.objects.get(id=usuario_id)
                booking_date = timezone.now().date()
                
                # Cálculo del precio total
                base_price = validated_data['price'] * validated_data['participants']  
                # Primer descarte gratis, después 5€ por categoría
                categories = validated_data.get('categories', [])
                category_fees = max(0, len(categories) - 1) * 5
                total_price = base_price + category_fees
                
                # Crea la experiencia asociada a la reserva
                experience = Experience.objects.create(
                    location=validated_data['location'],
                    categories=validated_data['categories'],
                    price=validated_data['price'],
                    notas_adicionales=validated_data.get('notas_adicionales', ''),
                    time_preference=validated_data['time_preference']
                )
                
                return Booking.objects.create(
                    experience=experience,
                    user=usuario,
                    status="PENDING",
                    cancellable=True,
                    experience_date=validated_data['experience_date'],
                    booking_date=booking_date,
                    total_price=total_price,
                    price=validated_data['price'],
                    participants=validated_data['participants'],
                    paid=False,
                )
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("User not found")
            except Exception as e:
                print(e)
                raise serializers.ValidationError(str(e))
        else:
            return Booking.objects.create(**validated_data)

class ReservaSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer()  # Serializa la experiencia completa
    experience_hint = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'participants', 'total_price', 'experience_date', 'booking_date', 'cancellable', 
            'status', 'user', 'experience', 'experience_hint', 'paid'
        ]

    def get_experience_hint(self, obj):
        # Devuelve la pista de la experiencia si faltan 48 horas o menos para la fecha de la experiencia.
        now = timezone.now().date()

        if obj.experience_date - now <= timedelta(days=2):
            return obj.experience.hint or "No hay ninguna pista para esta experiencia."
    
        return None
    

class AdminBookingSerializer(serializers.ModelSerializer):
    experience = ExperienceSerializer()  # Include the experience serializer
    user_name = serializers.CharField(source='user.name', read_only=True)  # Add user's name
    user_email = serializers.EmailField(source='user.email', read_only=True)  # Add user's email

    class Meta:
        model = Booking
        fields = ['id', 'experience_date', 'participants', 'total_price', 'status', 'user_name', 'user_email', 'experience', 'booking_date']  # Include user_name and user_email


class AdminBookingUpdateSerializer(serializers.ModelSerializer):
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
    categoria = serializers.ChoiceField(choices=ExperienceCategory.choices, required=False)
    experience_id = serializers.UUIDField(required=False)

    class Meta:
        model = Booking
        fields = ['participants', 'price', 'booking_date', 'experience_date', 'cancellable', 'status', 'hint', 
                  'duracion', 'localizacion', 'categoria', 'experience_id']

    def validate_experience_id(self, value):
        """
        Verificar que la experiencia exista
        """
        try:
            Experience.objects.get(id=value)
        except Experience.DoesNotExist:
            raise serializers.ValidationError("Experiencia no encontrada.")
        return value

    def validate_participants(self, value):
        if value < 1:
            raise serializers.ValidationError("El número de participantes debe ser mayor a cero.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio no puede ser negativo.")
        return value

    def validate(self, data):
        if len(data) == 0:
            raise serializers.ValidationError("No hay ningún campo para actualizar.")
        return data

    def update(self, instance, validated_data):
        hint = validated_data.pop('hint', None)
        experience_id = validated_data.pop('experience_id', None)

        if experience_id:
            try:
                instance.experience = Experience.objects.get(id=experience_id)
            except Experience.DoesNotExist:
                raise serializers.ValidationError("Experiencia no encontrada.")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if hint is not None and instance.experience:
            instance.experience.hint = hint
            instance.experience.save()

        instance.save()
        return instance

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            # ...existing fields...
            'time_preference',
        ]
