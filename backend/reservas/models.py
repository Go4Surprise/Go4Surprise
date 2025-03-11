import uuid
from django.db import models

# Create your models here.
class reserva(models.Model):
    class Categorias(models.TextChoices):
        MUSICA = "Musica"
        CULTURA_Y_ARTE = "Cultura y arte"
        DEPORTE_Y_MOTOR = "Deporte y motor"
        GASTRONOMIA = "Gastronomia"
        OCIO_NOCTURNO = "Ocio nocturno"
        AVENTURA = "aventura"
        
    class Momento(models.TextChoices):
        MAÑANA = "Mañana"
        MEDIO_DIA = "Medio dia"
        TARDE = "Tarde"
        NOCHE = "Noche"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    date = models.DateField()
    momento = models.CharField(choices=Momento.choices)
    
    categoria = models.CharField(choices=Categorias.choices)
    asistentes = models.IntegerField()
    
    pista = models.TextField(blank=True, null=True)
    ubicacion = models.TextField(blank=True, null=True)
    Url_organizador = models.URLField(blank=True, null=True)
    
    coste_por_persona = models.FloatField()
    
    
