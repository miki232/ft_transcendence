from django.db import models
from accounts.models import CustomUser
from django.utils import timezone

# Create your models here.
class RoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by =  models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    friendly = models.BooleanField(default=False)

    opponent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches', null=True)
    level = models.FloatField(max_length=2, default=0)
    tournament = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class WaitingUser(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    level = models.FloatField(max_length=2, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

class Tournament_Waitin(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    level = models.FloatField(max_length=2, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)


# Models Per Singolo torneo, match e partecipanti, Da poter sostituire con il modello già presente Match (accounts.models)
class Tournament_Match(models.Model):
    room_name = models.CharField(max_length=254, default="None")
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tournament_matches_as_user1', null=True)
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tournament_matches_as_user2', null=True)
    score_user1 = models.PositiveIntegerField(default=0)
    score_user2 = models.PositiveIntegerField(default=0)
    winner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='Turnament_won_matches', null=True)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'Match between {self.user1.username} and {self.user2.username} on {self.date}'

class TournamentRoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    user1 =  models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, related_name='user1')
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True , related_name='user2')
    level = models.FloatField(max_length=2, default=0)
    tournament = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Tournament(models.Model):
    name = models.CharField(max_length=255, unique=True, null=True)
    matches = models.ManyToManyField(Tournament_Match)
    timestamp = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='winner', null=True)

class TournametPlaceHolder(models.Model):
    playerNumber = models.IntegerField(default=0)
    status = models.BooleanField(default=False)
    round = models.IntegerField(default=0)
    name = models.CharField(max_length=255, unique=True, null=True)

class TournamentPartecipants(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
