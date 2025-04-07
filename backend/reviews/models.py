# Create your models here.
import uuid
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from users.models import Usuario
from experiences.models import Experience
from go4surprise.settings import GS_PUNTERO

def review_media_path(instance, filename):
    """Generate file path for new review media file"""
    ext = filename.split('.')[-1]  # Get file extension
    # Use UUID for uniqueness
    filename = f"{instance.review.id}_{uuid.uuid4().hex}.{ext}"
    return f"{GS_PUNTERO}/reviews/{filename}"

class Reviews(models.Model):
    id = models.AutoField(primary_key=True)
    puntuacion = models.DecimalField(
        max_digits=2, decimal_places=1,
        validators=[MaxValueValidator(5), MinValueValidator(0)]
    )
    comentario = models.TextField(max_length=250)
    user = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="reviews")  # Corregido
    experience = models.ForeignKey(Experience, on_delete=models.PROTECT, related_name="reviews")  # Corregido
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    
    def __str__(self):
        return f"Review de {self.user} para {self.experience} - Puntuación: {self.puntuacion}"

class ReviewMedia(models.Model):
    id = models.AutoField(primary_key=True)
    review = models.ForeignKey(Reviews, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to=review_media_path)
    file_type = models.CharField(max_length=10, choices=[('image', 'Image'), ('video', 'Video')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Media for {self.review}"
