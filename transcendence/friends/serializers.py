from rest_framework import serializers
from .models import FriendList, FriendRequest
from accounts.serializers import UserInfoSerializer

class FriendListSerializer(serializers.ModelSerializer):
    user = UserInfoSerializer(read_only=True)
    friends = UserInfoSerializer(many=True, read_only=True)

    class Meta:
        model = FriendList
        fields = ['user', 'friends']

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserInfoSerializer(read_only=True)
    receiver = UserInfoSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['sender', 'receiver', 'is_active', 'timestamp']