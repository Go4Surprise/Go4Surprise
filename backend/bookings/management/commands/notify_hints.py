from django.core.management.base import BaseCommand
from bookings.views import notify_users_about_hint

class Command(BaseCommand):
    help = "Notify users about hints becoming visible for their bookings"

    def handle(self, *args, **kwargs):
        notify_users_about_hint()
        self.stdout.write(self.style.SUCCESS("Notifications sent for visible hints."))
