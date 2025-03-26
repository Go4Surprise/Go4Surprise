# users/management/commands/cleanup_unverified_accounts.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import Usuario
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Elimina cuentas de usuario no verificadas después de 48 horas'

    def handle(self, *args, **options):
        # Calcular la fecha límite (48 horas atrás)
        expiration_time = timezone.now() - timedelta(hours=48)
        
        # Obtener usuarios no verificados con más de 48 horas
        unverified_users = Usuario.objects.filter(
            email_verified=False,
            email_verification_sent_at__lt=expiration_time
        )
        
        count = 0
        for usuario in unverified_users:
            try:
                user = usuario.user
                email = usuario.email
                logger.info(f"Eliminando usuario no verificado: {email}")
                user.delete()  # Esto eliminará también el Usuario por la cascada
                count += 1
            except Exception as e:
                logger.error(f"Error al eliminar usuario {usuario.id}: {str(e)}")
        
        self.stdout.write(
            self.style.SUCCESS(f'Se eliminaron {count} cuentas no verificadas')
        )
        logger.info(f'Se eliminaron {count} cuentas no verificadas')