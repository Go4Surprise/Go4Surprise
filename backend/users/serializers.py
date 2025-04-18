# serializers.py
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Usuario, Preferences
from django.contrib.auth.models import User


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    birthdate = serializers.DateField(required=True)

    
    class Meta:
        model = Usuario
        # Optionally, you might remove birthdate here so social registrations are not forced to supply it immediately.
        fields = ['id', 'username', 'password', 'name', 'surname', 'email', 'phone', 'pfp', 'birthdate']
    
    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        
        existing_user = User.objects.filter(username=username).first()
        if existing_user:
            raise serializers.ValidationError({"username": "Ya existe un usuario con este nombre."})
        
        user = User.objects.create_user(
            username=username, 
            password=password, 
            email=validated_data.get('email', '')
        )
        
        try:
            usuario = Usuario.objects.get(user=user)
            
            for key, value in validated_data.items():
                setattr(usuario, key, value)
            usuario.save()
        except Usuario.DoesNotExist:
            usuario = Usuario.objects.create(user=user, **validated_data)
        
        return usuario

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    resend_verification = serializers.BooleanField(required=False, default=False)
    
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
        
        # No verificamos aquí el email_verified porque lo hacemos en la vista
        # para poder dar mensajes personalizados
        
        preferences, created = Preferences.objects.get_or_create(usuario=usuario)
        preferences_set = any([
            preferences.music, preferences.culture, preferences.sports,
            preferences.gastronomy, preferences.nightlife, preferences.adventure
        ])
        tokens = RefreshToken.for_user(user)
        
        profile_complete = usuario.is_profile_complete
        
        return {
            "id": usuario.id,
            "user_id": user.id,
            "birthdate": usuario.birthdate,
            "username": user.username,
            "name": usuario.name,
            "surname": usuario.surname,
            "email": usuario.email,
            "phone": usuario.phone,
            "birthdate": usuario.birthdate,
            "pfp": usuario.pfp.url if usuario.pfp else None,
            "access": str(tokens.access_token),
            "refresh": str(tokens),
            "preferences_set": preferences_set,
            "profile_complete": profile_complete,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "email_verified": usuario.email_verified
        }


class PreferencesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Preferences
        fields = ['music', 'culture', 'sports', 'gastronomy', 'nightlife', 'adventure']


class UserSerializer(serializers.ModelSerializer):
    pfp = serializers.SerializerMethodField()  # Custom field for profile picture URL
    preferences = serializers.SerializerMethodField()  # Include user preferences
    username = serializers.CharField(source='user.username', read_only=True)  # Extrae username del modelo User
    birthdate = serializers.DateField()  # include birthdate
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'user', 'name', 'surname', 'email',
            'phone', 'pfp', 'preferences', 'username', 'birthdate'
        ]

    def get_pfp(self, obj):
        request = self.context.get('request')
        if obj.pfp:
            # When using GCS, the URL will be a complete URL rather than a relative path
            if settings.USE_GCS == 'True':
                return obj.pfp.url
            # For local storage, build the absolute URI
            elif request is not None:
                return request.build_absolute_uri(obj.pfp.url)
            return obj.pfp.url
        return None
    
    def get_preferences(self, obj):
        preferences = obj.preferences
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
    birthdate = serializers.DateField()  # allow updating birthdate
    pfp = serializers.ImageField(required=False)
    
    class Meta:
        model = Usuario
        fields = ['username', 'email', 'name', 'surname', 'phone', 'birthdate', 'pfp']
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)

        pfp = validated_data.pop('pfp', None)
        if pfp:
            if instance.pfp:
                # Delete old profile picture if using cloud storage
                try:
                    instance.pfp.delete(save=False)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
            instance.pfp = pfp

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return instance


class SocialLoginResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    name = serializers.CharField()
    surname = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    birthdate = serializers.DateField(allow_null=True)
    pfp = serializers.CharField(allow_null=True)
    access = serializers.CharField()
    refresh = serializers.CharField()
    preferences_set = serializers.BooleanField()
    profile_complete = serializers.BooleanField()

    def to_representation(self, instance):
        tokens = RefreshToken.for_user(instance.user)
        # Get the user's preferences, if they exist
        preferences = getattr(instance, 'preferences', None)
        preferences_set = False
        if preferences:
            # Check if any preference category is non-empty
            preferences_set = any([
                preferences.music, preferences.culture, preferences.sports,
                preferences.gastronomy, preferences.nightlife, preferences.adventure
            ])

        # Handle profile picture URL based on storage backend
        pfp_url = None
        if instance.pfp:
            if settings.USE_GCS == 'True':
                pfp_url = instance.pfp.url
            else:
                pfp_url = self.context.get('request').build_absolute_uri(instance.pfp.url)
                
        data = {
            "id": instance.id,
            "user_id": instance.user.id,
            "username": instance.user.username,
            "name": instance.name,
            "surname": instance.surname,
            "email": instance.email,
            "phone": instance.phone,
            "birthdate": instance.birthdate,
            "pfp": pfp_url,
            "access": str(tokens.access_token),
            "refresh": str(tokens),
            "preferences_set": preferences_set,
            "profile_complete": instance.is_profile_complete,
            "is_staff": instance.user.is_staff,
            "is_superuser": instance.user.is_superuser
        }
        return data


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
# When using GCS, return the complete URL directly
                if settings.USE_GCS == 'True':
                    return obj.usuario.pfp.url
                # For local storage, build the absolute URI
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
