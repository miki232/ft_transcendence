from rest_framework import serializers
from .models import Notifications, Message, Chat_RoomName
from accounts.models import CustomUser

class ChatSerializer(serializers.ModelSerializer):
	user1 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
	user2 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)

	class Meta:
		model = Chat_RoomName
		fields = ['pk', 'name', 'user1', 'user2']