import uuid
from django.db import models

from users.models import Usuario
from experiences.models import Experience

# Create your models here.
class Booking(models.Model):
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.PositiveIntegerField(default=1)
    price = models.FloatField(
        help_text="Precio por persona de la reserva. Debería ser el mismo que el de la experiencia, de los rangos de precio que haya."
    )
    total_price = models.FloatField(
        help_text="Precio total de la reserva. Precio por persona multiplicado por el número de participantes."
    )
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
        default='PENDING',
        help_text="Estado de la reserva. Comienza en 'PENDING' y se actualiza según se asigne la experiencia."
    )

    user = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='usuario')
    experience = models.ForeignKey(Experience, on_delete=models.CASCADE, related_name='reservas')

    
    

