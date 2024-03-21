from django.db import models
from accounts.models import CustomUser


# Create your models here.
class RoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=255)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches', default=1)
    
    def __str__(self):
        return self.name
