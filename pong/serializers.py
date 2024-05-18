from rest_framework import serializers
from .models import RoomName, TournametPlaceHolder
from accounts.models import CustomUser

class RoomNameSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
    opponent = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)

    class Meta:
        model = RoomName
        fields = ['name', 'created_by', 'opponent', 'public', 'level']

class TournamentPlaceHolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournametPlaceHolder
        fields = ['playerNumber', 'status']