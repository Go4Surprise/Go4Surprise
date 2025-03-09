import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver


class Usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=100)
    pfp = models.ImageField(upload_to='', null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="usuario")

    class Meta:
        ordering = ['-surname']
        indexes = [
            models.Index(fields=['-surname']),
        ]
    
    def __str__(self):
        return f"{self.name} {self.surname}"


# Separate Preferences model with extended questions
class Preferences(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="preferences")
    # Rating questions (0-5)
    adventure = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    culture = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    sports = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    gastronomy = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    nightlife = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    music = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
    preferences_set = models.BooleanField(default=False)
    
    # Extended fields
    preferred_event_type = models.CharField(max_length=50, blank=True, null=True)
    group_size = models.CharField(max_length=50, blank=True, null=True)
    dietary_restrictions = models.TextField(blank=True, null=True)
    preferred_time = models.CharField(max_length=50, blank=True, null=True)
    budget_range = models.CharField(max_length=50, blank=True, null=True)
    
    def get_preferences(self):
        return {
            'adventure': self.adventure,
            'culture': self.culture,
            'sports': self.sports,
            'gastronomy': self.gastronomy,
            'nightlife': self.nightlife,
            'music': self.music,
            'preferred_event_type': self.preferred_event_type,
            'group_size': self.group_size,
            'dietary_restrictions': self.dietary_restrictions,
            'preferred_time': self.preferred_time,
            'budget_range': self.budget_range,
        }
    
    def __str__(self):
        return f"Preferences for {self.usuario}"


@receiver(post_save, sender=Usuario)
def create_user_preferences(sender, instance, created, **kwargs):
    if created:
        Preferences.objects.create(usuario=instance)
