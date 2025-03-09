# Create your models here.
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from users.models import Usuario
from experiences.models import Experience

class Reviews(models.Model):
    id = models.AutoField(primary_key=True)
    puntuacion = models.DecimalField(
        max_digits=2, decimal_places=1,
        validators=[MaxValueValidator(5), MinValueValidator(0)]
    )
    comentario = models.TextField(max_length=250)
    user = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="reviews")  # Corregido
    experience = models.ForeignKey(Experience, on_delete=models.PROTECT, related_name="reviews")  # Corregido

    def __str__(self):
        return f"Review de {self.user} para {self.experience} - Puntuación: {self.puntuacion}"
