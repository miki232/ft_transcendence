from django.urls import re_path

from . import consumers, tournament

websocket_urlpatterns = [
    re_path(r"ws/pong/(?P<room_name>\w+)/$", consumers.PongConsumer.as_asgi()),
    re_path(r"ws/matchmaking/$", consumers.MatchMaking.as_asgi()),
    re_path(r"ws/local/(?P<room_name>\w+)/$", consumers.Pong_LocalConsumer.as_asgi()),
    re_path(r"ws/tournament/(?P<room_name>\w+)/$", tournament.TournamentConsumer.as_asgi()),

]