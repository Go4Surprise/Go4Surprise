from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import Usuario


class Command(BaseCommand):
    help = 'Create Usuario objects for users without one'

    def handle(self, *args, **options):
        users_without_usuario = User.objects.filter(usuario__isnull=True)
        for user in users_without_usuario:
            Usuario.objects.create(
                user=user,
                email=user.email,
                name=user.first_name or '',
                surname=user.last_name or '',
                phone='',
                birthdate='2000-01-01',
            )
            self.stdout.write(self.style.SUCCESS(f'Created Usuario for {user.username}'))
