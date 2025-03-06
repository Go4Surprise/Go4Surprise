from rest_framework import serializers
from .models import Experience

class ExperienceSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    hint = serializers.CharField(required=False)
    link = serializers.URLField(required=False)

    class Meta:
        model = Experience
        fields = ['title', 'description', 'hint', 'link']