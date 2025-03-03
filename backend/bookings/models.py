import uuid
from django.db import models

from users.models import Usuario
from experiences.models import Experience

# Create your models here.
class Booking(models.Model):
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.PositiveIntegerField(default=1)
    total_price = models.FloatField()
    booking_date = models.DateField()
    experience_date = models.DateField()
    cancellable = models.BooleanField()
    status = models.CharField(
        max_length=50,
        choices=(
            ('PENDING', 'Pendiente'),
            ('CANCELLED', 'Cancelada'),
            ('CONFIRMED', 'Confirmada'),
        ),
        default='PENDING'
    )

    user = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reservas')
    experience = models.ForeignKey(Experience, on_delete=models.CASCADE, related_name='reservas')

    
    

