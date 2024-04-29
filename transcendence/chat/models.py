from django.db import models
from accounts.models import CustomUser
# Create your models here.

class Notifications(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    read = models.BooleanField(default=False)

