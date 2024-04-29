from django.db import models
from accounts.models import CustomUser


# Create your models here.
class RoomName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by =  models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    public = models.BooleanField(default=False)
    opponent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches')
    
    def __str__(self):
        return self.name
