from django.db import models
from accounts.models import CustomUser
# Create your models here.

class Notifications(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    read = models.BooleanField(default=False)

class Message(models.Model):
    name = models.CharField(max_length=255, default="None")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

class Chat_RoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    user1 =  models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_user1" , null=True)
    user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE,  related_name="chat_user2" , null=True)

    def __str__(self):
        return self.name