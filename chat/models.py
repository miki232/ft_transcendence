from django.db import models
from accounts.models import CustomUser
# Create your models here.

class Notifications(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    read = models.BooleanField(default=False)

# class Chat(models.Model):
#     id
#     users = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
#     messages = 
#     read = models.BooleanField(default=False)

# class Message(models.Model):
#     content
#     user
#     timestamp
#     chat