from rest_framework import serializers
from .models import RoomName, TournamentPlaceHolder, Tournament_Match, Tournament, LocalTournament, LocalTournament_Match
from accounts.models import CustomUser

class RoomNameSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
    opponent = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all(), allow_null=True)
    pro_pic_created_by = serializers.URLField(source='created_by.pro_pic', read_only=True)
    pro_pic_opponent = serializers.URLField(source='opponent.pro_pic', read_only=True)

    class Meta:
        model = RoomName
        fields = ['name', 'created_by', 'opponent', 'friendly', 'level', 'pro_pic_created_by', 'pro_pic_opponent']


class UserAliasSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['alias', 'username']

class tournamentRoomSerializer(serializers.ModelSerializer):
    created_by = UserAliasSerializer(read_only=True)
    opponent =  UserAliasSerializer(read_only=True)
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

class TMatchSerializer(serializers.ModelSerializer):
    user1 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    user2 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    winner = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    
    class Meta:
        model = Tournament_Match
        fields = ['room_name', 'user1', 'user2', 'score_user1', 'score_user2', 'winner']

class TournamentSerializer(serializers.ModelSerializer):
    winner = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    matches = TMatchSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = ['name', 'matches', 'timestamp', 'winner']


class LocalTournamentMatchSerializer(serializers.ModelSerializer):
    user1 = serializers.CharField()
    user2 = serializers.CharField()

    class Meta:
        model = LocalTournament_Match
        fields = ['pk', 'room_name', 'user1', 'user2', 'score_user1', 'score_user2', 'winner', 'date']

class LocalTournamentSerializer(serializers.ModelSerializer):
    matches = LocalTournamentMatchSerializer(many=True, read_only=True)

    class Meta:
        model = LocalTournament
        fields = ['pk', 'name', 'matches', 'timestamp', 'winner']
