from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Usuario, Preferences
from.models import Usuario, Preferences


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'password', 'name', 'surname', 'email', 'phone', 'pfp']

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        user = User.objects.create_user(username=username, password=password, email=validated_data['email'])
        
        usuario = Usuario.objects.create(user=user, **validated_data)
        return usuario

    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if not username:
            raise serializers.ValidationError({"username": "El nombre de usuario es obligatorio."})
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria."})

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({"error": "Contraseña o usuario incorrecto."})

        try:
            usuario = Usuario.objects.get(user=user)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({"error": "El usuario autenticado no tiene un perfil asociado."})

        preferences, created = Preferences.objects.get_or_create(usuario=usuario)

        preferences_set = any([
            preferences.music, preferences.culture, preferences.sports,
            preferences.gastronomy, preferences.nightlife, preferences.adventure
        ])

        tokens = RefreshToken.for_user(user)
        
        return {
            "id": usuario.id,
            "user_id": user.id,
            "username": user.username,
            "name": usuario.name,
            "surname": usuario.surname,
            "email": usuario.email,
            "phone": usuario.phone,
            "pfp": usuario.pfp.url if usuario.pfp else None,
            "access": str(tokens.access_token),
            "refresh": str(tokens),
            "preferences_set": preferences_set,  
            "is_superuser": user.is_superuser,
            "is_staff": user.is_staff
        }

class PreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preferences
        fields = [
            'music', 'culture', 'sports', 'gastronomy', 'nightlife', 'adventure'
        ]




class UserSerializer(serializers.ModelSerializer):
    pfp = serializers.SerializerMethodField()  # Custom field for profile picture URL
    preferences = serializers.SerializerMethodField()  # Include user preferences
    username = serializers.CharField(source='user.username', read_only=True)  # Extrae username del modelo User

    class Meta:
        model = Usuario
        fields = [
            'id', 'user', 'name', 'surname', 'email', 
            'phone', 'pfp', 'preferences', 'username'
        ]

    def get_pfp(self, obj):
        """Return the full URL of the profile picture if it exists."""
        request = self.context.get('request')
        if obj.pfp:
            return request.build_absolute_uri(obj.pfp.url) if request else obj.pfp.url
        return None

    def get_preferences(self, obj):
        """Return user preferences if they exist."""
        preferences = obj.preferences  # Access the related Preferences object
        if preferences:
            return {
                "music": preferences.music,
                "culture": preferences.culture,
                "sports": preferences.sports,
                "gastronomy": preferences.gastronomy,
                "nightlife": preferences.nightlife,
                "adventure": preferences.adventure,
            }
        return None
    
class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')

    class Meta:
        model = Usuario  # Asegúrate de que es el modelo correcto
        fields = ['username', 'email', 'name', 'surname', 'phone']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)  # Extraer datos de User si existen

        # Actualizar campos del modelo Usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si hay datos en User, actualizarlos
        if user_data:
            user = instance.user  # Relación con User
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return instance
    

class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used by admin views"""
    # Get related Usuario fields
    name = serializers.CharField(source='usuario.name', read_only=True)
    surname = serializers.CharField(source='usuario.surname', read_only=True)
    phone = serializers.CharField(source='usuario.phone', read_only=True)
    profile_id = serializers.IntegerField(source='usuario.id', read_only=True)
    pfp = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser',
            'profile_id', 'name', 'surname', 'phone', 'pfp'
        ]

    def get_pfp(self, obj):
        """Return the profile picture URL if it exists"""
        request = self.context.get('request')
        try:
            if obj.usuario and obj.usuario.pfp:
                return request.build_absolute_uri(obj.usuario.pfp.url) if request else obj.usuario.pfp.url
        except Usuario.DoesNotExist:
            pass
        return None

class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating User model from admin panel"""

    username = serializers.CharField(required=False)
    name = serializers.CharField(write_only=True, required=False)
    surname = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)

    class Meta:
        model = User  # Changed from Usuario to User
        fields = ['username', 'email', 'is_staff', 'is_superuser', 'name', 'surname', 'phone']

    def validate(self, data):
        if len(data) == 0:
            raise serializers.ValidationError("No hay ningún campo para actualizar.")
        return data

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        surname = validated_data.pop('surname', None)
        phone = validated_data.pop('phone', None)
        email = validated_data.pop('email', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        try:
            usuario = instance.usuario
            if name is not None:
                usuario.name = name
            if surname is not None:
                usuario.surname = surname
            if phone is not None:
                usuario.phone = phone
            if email is not None:
                usuario.email = email
            usuario.save()
        except Usuario.DoesNotExist:
            pass

        return instance