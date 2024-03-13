from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.

def index(request):
    return render(request, "chat/index.html")

@login_required
def room(request, room_name):
    return render(request, "chat/room.html", {"room_name": room_name})

@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})