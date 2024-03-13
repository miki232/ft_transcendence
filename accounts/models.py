# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser): # new
    pass
    # add additional fields in here
    def __str__(self):
        return self.username
