from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from .models import RoomName
from accounts.models import CustomUser
from friends.models import FriendList
from .serializers import RoomNameSerializer

from django.core.exceptions import ObjectDoesNotExist

class CreateRoomView(APIView):
    def post(self, request, format=None):
        serializer = RoomNameSerializer(data=request.data)
        if serializer.is_valid():
            username = request.data.get("created_by")
            user = CustomUser.objects.get(username=username)
            serializer.save(user=user)
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
            rooms = RoomName.objects.filter(Q(user__in=friends) | Q(user=user) | Q(public=True))
        except ObjectDoesNotExist:
            rooms = RoomName.objects.filter(Q(user=user) | Q(public=True))


        
        serializer = RoomNameSerializer(rooms, many=True)
        return Response(serializer.data)

# Create your views here.
@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})