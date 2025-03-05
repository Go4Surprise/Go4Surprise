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
    title = models.CharField(max_length=50)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    location = models.CharField(max_length=50)
    duration = models.PositiveIntegerField()
    hint = models.CharField(max_length=255)
    link = models.URLField()
    category = models.CharField(max_length=50, choices=ExperienceCategory.choices)

    class Meta:
        ordering = ['-price']
        indexes = [
            models.Index(fields=['-price']),
        ]
    
    def __str__(self):
        return self.title