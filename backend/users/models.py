# users/models.py
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from go4surprise.settings import GS_PUNTERO

def profile_pic_path(instance, filename):
    """Generate file path for new profile picture"""
    ext = filename.split('.')[-1]  # Get file extension
    # Use UUID instead of user ID for even better uniqueness
    filename = f"{instance.id}_{uuid.uuid4().hex}.{ext}"
    return f"{GS_PUNTERO}/profile_pics/{filename}"

class Usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=100)
    pfp = models.ImageField(upload_to=profile_pic_path, null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)
    birthdate = models.DateField(null=True, blank=True, default='2003-11-07')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="usuario")
    # Nuevos campos para verificación de email
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    email_verification_sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-surname']
        indexes = [
            models.Index(fields=['-surname']),
        ]
    
    def __str__(self):
        return f"{self.name} {self.surname}"

    @property
    def is_profile_complete(self):
        return self.birthdate is not None and bool(self.phone)
    
    @property
    def is_verification_expired(self):
        """Determina si el token de verificación ha expirado (48 horas)"""
        if not self.email_verification_sent_at:
            return True
        expiration_time = self.email_verification_sent_at + timedelta(hours=48)
        return timezone.now() > expiration_time
    
    def refresh_verification_token(self):
        """Regenera el token de verificación y actualiza la marca de tiempo"""
        self.email_verification_token = uuid.uuid4()
        self.email_verification_sent_at = timezone.now()
        self.save()


class Preferences(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="preferences")
    
    music = models.JSONField(default=list)
    culture = models.JSONField(default=list)
    sports = models.JSONField(default=list)
    gastronomy = models.JSONField(default=list)
    nightlife = models.JSONField(default=list)
    adventure = models.JSONField(default=list)

    def __str__(self):
        return f"Preferences for {self.usuario}"


@receiver(post_save, sender=Usuario)
def create_user_preferences(sender, instance, created, **kwargs):
    if created:
        if not hasattr(instance, 'preferences'):
            Preferences.objects.create(usuario=instance)