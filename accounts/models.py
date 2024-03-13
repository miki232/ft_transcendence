from django.db import models
from django.contrib.auth.models import AbstractUser # new
# Create your models here.

class CustomUser(AbstractUser): # new
    pass
    # add additional fields in here
    def __str__(self):
        return self.username
