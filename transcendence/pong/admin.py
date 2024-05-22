from django.contrib import admin
from .models import RoomName, WaitingUser, Tournament_Waitin, Tournament_Match, Tournament, TournametPlaceHolder
# Register your models here.

admin.site.register(RoomName)
admin.site.register(WaitingUser)
admin.site.register(Tournament_Waitin)
admin.site.register(Tournament_Match)
admin.site.register(Tournament)
admin.site.register(TournametPlaceHolder)


