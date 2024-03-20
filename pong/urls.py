# chat/urls.py
from django.urls import path

from . import views


urlpatterns = [
    path("<str:room_name>/", views.pong, name="pong"),

]