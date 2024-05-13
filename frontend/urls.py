from django.urls import path
from . import views
from pong.views import ListRoomView, CreateRoomView, MatchmakingView

urlpatterns = [
    path("", views.index, name="index"),
    path('csrf-token', views.csrf, name='csrf'),
    path('about/', views.about, name="about"),
    path('contact/', views.contact, name='contact'),
    path('login/', views.login, name='login'),
    path('room/', views.room, name="room"),
    path('rooms_list/', ListRoomView.as_view(), name='rooms_list'),
    path('matchmaking/', MatchmakingView.as_view(), name="matchmaking"),
    path('room_namelocal/', views.room_namelocal, name='room_namelocal'),
    path('liberate_room/', views.liberate_room, name='liberate_room'),
    # path('rooms/create/', CreateRoomView.as_view(), name='create_room'), #spostato in pong/urls.py
    path("test/", views.test, name="test"),
]