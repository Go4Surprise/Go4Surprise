import uuid
from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=100)
    pfp = models.ImageField(upload_to='', null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=15)

    user = models.OneToOneField(User, on_delete=models.CASCADE)
