from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})