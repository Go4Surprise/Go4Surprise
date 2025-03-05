import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.
class Usuario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=100)
    pfp = models.ImageField(upload_to='', null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=15)

    adventure = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    culture = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    sports = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    gastronomy = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    nightlife = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])
    music = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)])

    user = models.OneToOneField(User, on_delete=models.CASCADE)


    def get_preferences(self):
        preferences = {}
        preferences['adventure'] = self.adventure
        preferences['culture'] = self.culture
        preferences['sports'] = self.sports
        preferences['gastronomy'] = self.gastronomy
        preferences['nightlife'] = self.nightlife
        preferences['music'] = self.music
        return preferences
