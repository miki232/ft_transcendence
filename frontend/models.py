from django.db import models
from django.utils import timezone

from accounts.models import CustomUser
# Create your models here.

class roomLocal(models.Model):
    roomname = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.roomname