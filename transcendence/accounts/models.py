# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
import redis, time

r = redis.Redis(host='redis', port=6379, db=0)  # Connect to your Redis instance


class CustomUser(AbstractUser): # new
    #https://i.pravatar.cc/300
    #https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg
    pro_pic = models.URLField(default="https://api.dicebear.com/8.x/thumbs/svg?seed=Nala&scale=90&radius=50&backgroundColor=ffdfbf")
    status_login = models.BooleanField(default=False)
    alias = models.CharField(max_length=254, default="None")
    email = models.EmailField(unique=True)
    Ai = models.BooleanField(default=False)
    Occupied = models.BooleanField(default=False)
    language = models.CharField(max_length=254, default="en")
    paddle_color = models.CharField(max_length=254, default="#00FF99")
    pong_color = models.CharField(max_length=254, default="#141414")
    OAuth = models.BooleanField(default=False)
    blocked_users = models.ManyToManyField('self', symmetrical=False, blank=True)
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
    def calculate_exp(self):
        match_history = self.get_match_history()
        total_wins = len([match for match in match_history if match['winner__username'] == self.username])
        total_loses = len([match for match in match_history if match['winner__username'] != self.username])
        total_exp = total_wins - total_loses
        return total_exp , total_wins, total_loses
    
    def calculate_level(self):
        exp = {
            0: 0,
            1: 1,
            2: 2,
            3: 3,
            5: 4,
            8: 5,
            13: 6,
            21: 7,
            34: 8,
            55: 9,
            89: 10,
            144: 11,
            233: 12,
            377: 13,
            610: 14,
            987: 15,
        }
        total_exp, total_win, total_loses = self.calculate_exp()
        if total_exp > 987:
            total_exp = 987
        if total_exp < 0:
            total_exp = 0 
        # Set level equal to total exp in exp list
        for i in exp:
            if total_exp >= i:
                level = exp[i]
        if self.Ai:
            level = 0
        return level
    

    def is_user_online(self, user_id):
        last_seen_timestamp = r.zscore('online_users', user_id)
        if last_seen_timestamp is None:
            return False
        if self.status_login == False:
            return False
        current_time = int(time.time())
        return (current_time - last_seen_timestamp) <= 300 # 30 seconds 
    
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