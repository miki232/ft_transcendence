from rest_framework import serializers
from .models import RoomName, TournamentPlaceHolder, Tournament_Match
from accounts.models import CustomUser

class RoomNameSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
    opponent = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
    pro_pic_created_by = serializers.URLField(source='created_by.pro_pic', read_only=True)
    pro_pic_opponent = serializers.URLField(source='opponent.pro_pic', read_only=True)

    class Meta:
        model = RoomName
        fields = ['name', 'created_by', 'opponent', 'friendly', 'level', 'pro_pic_created_by', 'pro_pic_opponent']

class TournamentPlaceHolderSerializer(serializers.ModelSerializer): 
    class Meta:
        model = TournamentPlaceHolder
        fields = ['playerNumber', 'status', 'round', 'name']

class TournametMatchSerializer(serializers.ModelSerializer):
    player1 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    player2 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    
    class Meta:
        model = Tournament_Match
        fields = ['name', 'player1', 'player2', 'player1_score', 'player2_score', 'result']