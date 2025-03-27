from django.db import models
import uuid

# Create your models here.



class Experience(models.Model):

    class ExperienceCategory(models.TextChoices):
        ADVENTURE = "ADVENTURE", "Aventura"
        CULTURE = "CULTURE", "Cultura"
        SPORTS = "SPORTS", "Deporte"
        GASTRONOMY = "GASTRONOMY", "Gastronomía"
        NIGHTLIFE = "NIGHTLIFE", "Ocio nocturno"
        MUSIC = "MUSIC", "Música"
        
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Precio por persona de la experiencia. Deberían haber rangos de precios prefijados.")                            
    location = models.CharField(max_length=50)
    duration = models.PositiveIntegerField()
    hint = models.CharField(max_length=255, blank=True)
    link = models.URLField(blank=True)
    category = models.CharField(max_length=50, choices=ExperienceCategory.choices)

    class Meta:
        ordering = ['-price']
        indexes = [
            models.Index(fields=['-price']),
        ]
    
    def __str__(self):
        return self.title