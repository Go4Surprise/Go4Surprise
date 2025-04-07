from django.core.management.base import BaseCommand
from bookings.views import notify_users_about_experience_details
 
class Command(BaseCommand):
    help = "Notify users about their experience details 24 hours before the experience date"
 
    def handle(self, *args, **kwargs):
        notify_users_about_experience_details()
        self.stdout.write(self.style.SUCCESS("Notifications sent for experience details."))