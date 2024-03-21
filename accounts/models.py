# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser): # new
    pro_pic = models.URLField(default="https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg")
    # add additional fields in here
    def __str__(self):
        return self.username
