from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .serializers import ChatSerializer
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
# Create your views here.

class ChatCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    
    

def index(request):
    return render(request, "chat/index.html")

@login_required
def room(request, room_name):
    return render(request, "chat/room.html", {"room_name": room_name})