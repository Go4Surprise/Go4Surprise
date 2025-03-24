from rest_framework import serializers
from .models import Experience, ExperienceCategory

class ExperienceSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    hint = serializers.CharField(required=False)
    link = serializers.URLField(required=False)
    price = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)
    location = serializers.CharField(required=True)
    duration = serializers.IntegerField(required=True)
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=ExperienceCategory.choices),
        required=True
    )

    def validate_price(self, value):
        print(f"✅ Validando price: {value}")
        if value < 0:
            raise serializers.ValidationError("El precio no puede ser negativo.")
        return value

    def validate_duration(self, value):
        if not isinstance(value, int) or value <= 0:
            raise serializers.ValidationError("La duración debe ser un número entero mayor que 0.")
        return value
    
    def validate_categories(self, value):
        if len(value) > 3:
            raise serializers.ValidationError("No puedes seleccionar más de 3 categorías.")
        return value

    class Meta:
        model = Experience
        fields = '__all__'  # Ahora incluirá todos los campos