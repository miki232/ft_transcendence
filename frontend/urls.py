from django.urls import path
from . import views
from pong.views import ListRoomView, CreateRoomView

urlpatterns = [
    path("", views.index, name="index"),
    path('csrf-token', views.csrf, name='csrf'),
    path('about/', views.about, name="about"),
    path('contact/', views.contact, name='contact'),
    path('login/', views.login, name='login'),
    path('room/', views.room, name="room"),
    path('rooms_list/', ListRoomView.as_view(), name='rooms_list'),
    path('rooms/create/', CreateRoomView.as_view(), name='create_room'),
    path("test/", views.test, name="test")
]