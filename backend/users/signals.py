# users/signals.py
from django.apps import apps
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import Usuario
from django.contrib.auth.models import User


@receiver(post_save, sender=User)
def create_usuario_for_user(sender, instance, created, **kwargs):
    if created:
        if not hasattr(instance, 'usuario'):
            try:
                Usuario.objects.create(
                    user=instance,
                    email=instance.email,
                    name=instance.first_name or '',
                    surname=instance.last_name or '',
                    phone='',
                    birthdate='2000-01-01',
                )
            except Exception as e:
                print(f"Error creating Usuario for {instance.username}: {e}")
