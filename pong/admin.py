from django.contrib import admin
from .models import TournamentRoomName, RoomName, WaitingUser, Tournament_Waitin, Tournament_Match, Tournament, TournamentPlaceHolder, LocalTournament, LocalTournament_Match
# Register your models here.

admin.site.register(RoomName)
admin.site.register(WaitingUser)
admin.site.register(Tournament_Waitin)
admin.site.register(Tournament_Match)
admin.site.register(Tournament)
admin.site.register(TournamentPlaceHolder)
admin.site.register(LocalTournament)
admin.site.register(LocalTournament_Match)
admin.site.register(TournamentRoomName)


