from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.http import JsonResponse
from django.db import IntegrityError
from django.conf import settings
from django.core.exceptions import MultipleObjectsReturned
from django.utils.html import escape
from django.contrib import messages
import uuid
from django.db.models import Q


# Create your views here.
from .serializers import ChatSerializer
from .models import Chat_RoomName
from accounts.models import CustomUser

def index(request):
    return render(request, "chat/index.html")

class ChatCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def post(self, request, *args, **kwargs):
        room_name = request.data.get("name")
        user1 = request.data.get("user1")
        user2 = request.data.get("user2")
        print("Create Room View 31", user1, user2)

        try:
            room_name = str(uuid.uuid1()).replace('-', '')
            user1 = CustomUser.objects.get(username=user1)
            user2 = CustomUser.objects.get(username=user2)
            print("Create Room View 32", user1)
            exist_room = Chat_RoomName.objects.filter(user1=user2, user2=user1)
            if exist_room:
                return Response({"status": "Room already exists", "name" : exist_room.name}, status=status.HTTP_306_RESERVED)
            serializer = ChatSerializer(data={
            'user1': user1,
            'user2': user2,
            'name': room_name,
            })
            if serializer.is_valid():
                serializer.save()  # Save the instance
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # Return a response with serializer errors if the data is not valid
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class ChatListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request, *args, **kwargs):
        user = request.user
        rooms = Chat_RoomName.objects.filter(Q(user1=user) | Q(user2=user))
        serializer = ChatSerializer(rooms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@login_required
def room(request, room_name):
    return render(request, "chat/room.html", {"room_name": room_name})