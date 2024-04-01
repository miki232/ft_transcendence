# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser): # new
    pro_pic = models.URLField(default="https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg")
    status_login = models.CharField(max_length=50, default="Offline")
    email = models.EmailField(unique=True)
    # wins= models.PositiveIntegerField(default=0)
    # losses= models.PositiveIntegerField(default=0)
    def get_match_history(self):
        # Get the matches where the user is user1 or user2
        matches_as_user1 = self.matches_as_user1.all()
        matches_as_user2 = self.matches_as_user2.all()

        # Combine the querysets
        match_history = matches_as_user1.union(matches_as_user2)

        # Convert the queryset to a list of dictionaries
        match_history = list(match_history.values('user1__username', 'user2__username', 'score_user1', 'score_user2', 'winner__username', 'date'))

        return match_history
    # add additional fields in here
    def __str__(self):
        return self.username


class Match(models.Model):
    room_name = models.CharField(max_length=254, default="None")
    user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches_as_user1')
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches_as_user2')
    score_user1 = models.PositiveIntegerField()
    score_user2 = models.PositiveIntegerField()
    winner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='won_matches', null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Match between {self.user1.username} and {self.user2.username} on {self.date}'