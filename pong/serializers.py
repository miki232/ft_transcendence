from rest_framework import serializers
from .models import RoomName
from accounts.models import CustomUser

class RoomNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomName
        fields = ['name', 'user', 'public']