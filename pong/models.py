from django.db import models
from accounts.models import CustomUser


# Create your models here.
class RoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by =  models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    public = models.BooleanField(default=False)
    opponent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches', null=True)
    level = models.FloatField(max_length=2, default=0)

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

class Tournament_Match(models.Model):
    name = models.CharField(max_length=255, unique=True, null=True)
    player1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='player2')
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    result = models.CharField(max_length=255, null=True)

class Tournament(models.Model):
    match = models.ForeignKey(Tournament_Match, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='winner', null=True)

class TournametPlaceHolder(models.Model):
    playerNumber = models.IntegerField(default=0)
    status = models.BooleanField(default=False)