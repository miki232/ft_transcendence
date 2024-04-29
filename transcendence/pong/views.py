from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from .models import RoomName
from accounts.models import CustomUser
from friends.models import FriendList
from chat.notifier import get_db, update_db_notifications, send_save_notification
from .serializers import RoomNameSerializer
import uuid
from django.core.exceptions import ObjectDoesNotExist

class CreateRoomView(APIView):
    def post(self, request, format=None):
        room_name = request.data.get("name")
        if room_name == "1":
            room_name = str(uuid.uuid4()) ##Genera un nome per la room random.
        username = request.data.get("created_by")
        sfidante = request.data.get("to_fight")
        user = CustomUser.objects.get(username=username)
        user_to_fight = CustomUser.objects.get(username=sfidante)
        print(user_to_fight)
        send_save_notification(user_to_fight, f"{user} Want to play with YOU!")
        # Pass the primary keys to the serializer
        serializer = RoomNameSerializer(data={
            'created_by': user,
            'opponent': user_to_fight,
            'name': room_name
        })

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ListRoomView(APIView):
    """
    Ritornare una lista di room, soltanto se chi ha creato la room è amico di self.user
    o se è una room pubblica
    """
    def get(self, request, format=None):
        # print(request.user)
        user = CustomUser.objects.get(username=request.user)
        
        # Filter the RoomName queryset to only include rooms created by the user's friends or by the request.user, and where public is True
        try:
            friendslist = FriendList.objects.get(user=user)
            friends = friendslist.friends.all()
            rooms = RoomName.objects.filter(Q(opponent__in=friends) | Q(opponent=user) | Q(public=True))
        except ObjectDoesNotExist:
            rooms = RoomName.objects.filter(Q(opponent=user) | Q(public=True))


        
        serializer = RoomNameSerializer(rooms, many=True)
        return Response(serializer.data)

# Create your views here.
@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})