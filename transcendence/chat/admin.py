from django.contrib import admin
from .models import Notifications, Chat_RoomName, Message
# Register your models here.

admin.site.register(Notifications)
admin.site.register(Chat_RoomName)
admin.site.register(Message)