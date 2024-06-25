from .model import Chat
from rest_framework import serializers
from accounts.serializers import CustomUserSerializer
from .models import Notifications, Message

class ChatSerializer(serializers.ModelSerializer):
	class Meta:
		model = Chat
		fields = "__all__"