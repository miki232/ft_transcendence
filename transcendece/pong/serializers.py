from rest_framework import serializers
from .models import RoomName

class RoomNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomName
        fields = ['name']