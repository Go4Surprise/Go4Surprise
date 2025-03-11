import uuid
from rest_framework import serializers
from .models import reserva
from datetime import date

class CrearReservaSerializer(serializers.ModelSerializer):
    date = serializers.DateField(required=True)
    momento = serializers.ChoiceField(choices=reserva.Momento.choices, required=True)
    categoria = serializers.ChoiceField(choices=reserva.Categorias.choices,required=True)
    asistentes = serializers.IntegerField(required=True)
    ubicacion = serializers.CharField(required=True)
    coste_por_persona = serializers.FloatField(required=True)

    class Meta:
        model = reserva
        fields = ['date', 'momento', 'categoria', 'asistentes', 'ubicacion', 'coste_por_persona']

class ReservaSerializer(serializers.ModelSerializer):
    class Meta:
        model = reserva
        fields = '__all__'