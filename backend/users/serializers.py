from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from.models import Usuario

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = Usuario
        fields = ['username', 'password', 'name', 'surname', 'email', 'phone', 'pfp']

    def create(self, validated_data):
        username =validated_data.pop('username')
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
        
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Contraseña o usuarios incorrectos")
        
        usuario = Usuario.objects.get(user=user)
        
        tokens = RefreshToken.for_user(user)
        return {
            "user_id": user.id,
            "username": user.username,
            "name": usuario.name,
            "surname": usuario.surname,
            "email": usuario.email,
            "phone": usuario.phone,
            "pfp": usuario.pfp.url if usuario.pfp else None,
            "access": str(tokens.access_token),
            "refresh": str(tokens),
        }