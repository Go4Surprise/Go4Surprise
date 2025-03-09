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


class Preferences(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="preferences")
    
    # Ahora las preferencias se almacenan como listas de opciones en JSONField
    music = models.JSONField(default=list)
    culture = models.JSONField(default=list)
    sports = models.JSONField(default=list)
    gastronomy = models.JSONField(default=list)
    nightlife = models.JSONField(default=list)
    adventure = models.JSONField(default=list)
    
    # Preguntas adicionales
    dietary_restrictions = models.JSONField(default=list, blank=True, null=True)
    budget_range = models.JSONField(default=list, blank=True, null=True)

    def __str__(self):
        return f"Preferences for {self.usuario}"
    
@receiver(post_save, sender=Usuario)
def create_user_preferences(sender, instance, created, **kwargs):
    if created:
        if not hasattr(instance, 'preferences'):
            Preferences.objects.create(usuario=instance)