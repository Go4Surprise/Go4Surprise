from django.db import models

# Create your models here.
class Usuario(models.Model):
    id = models.UUIDField(primary_key=True)
    
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=100)
    nick = models.CharField(max_length=100)
    
    pfp = models.ImageField()
    email = models.EmailField()
    dni = models.CharField(max_length=9, default=None)
