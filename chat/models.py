from django.db import models
from accounts.models import CustomUser
# Create your models here.

class Notifications(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    read = models.BooleanField(default=False)

class Message(models.Model):
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.OneToOneField(CustomUser, on_delete=models.CASCADE)

class Chat(models.Model):
    users = models.ManyToManyField(CustomUser)
    messages = models.ForeignKey(Message, on_delete=models.CASCADE)
