from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import RoomName
from .serializers import RoomNameSerializer


class CreateRoomView(APIView):
    def post(self, request, format=None):
        serializer = RoomNameSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ListRoomView(APIView):
    def get(self, request, format=None):
        rooms = RoomName.objects.all()
        serializer = RoomNameSerializer(rooms, many=True)
        return Response(serializer.data)

# Create your views here.
@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})