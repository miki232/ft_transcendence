# chat/urls.py
from django.urls import path

from . import views


urlpatterns = [
    path('create/', views.CreateRoomView.as_view() , name='create_room'),
    path("<str:room_name>/", views.pong, name="pong"),
    
]