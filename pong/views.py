from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views import View

from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from .models import RoomName, WaitingUser, TournamentPlaceHolder, Tournament_Waitin, Tournament_Match
from accounts.models import CustomUser
from friends.models import FriendList
from chat.notifier import get_db, update_db_notifications, send_save_notification
from .serializers import RoomNameSerializer, TournamentPlaceHolderSerializer, TournametMatchSerializer
import uuid
from django.core.exceptions import ObjectDoesNotExist
from accounts.models import Match
from accounts.serializers import UserInfoSerializer

class CreateRoomView(APIView):
    def post(self, request, format=None):
        room_name = request.data.get("name")
        user_to_fight = None
        user = None
        username = request.data.get("created_by")
        friendly = False

        if room_name == "1":
            friendly = True
            room_name = str(uuid.uuid1()).replace('-', '')
            sfidante = request.data.get("to_fight")
            user_to_fight = CustomUser.objects.get(username=sfidante)
            user = CustomUser.objects.get(username=username)
            print("Create Room View 32", user_to_fight)
            send_save_notification(user_to_fight, f"{username} Want to play with YOU!")
            serializer = RoomNameSerializer(data={
            'created_by': user,
            'opponent': user_to_fight,
            'name': room_name,
            'friendly' : friendly,
            })
        else:
            room_name = str(uuid.uuid1()).replace('-', '')
            # Pass the primary keys to the serializer
            print("Create Room View 44", CustomUser.calculate_level(user))
            serializer = RoomNameSerializer(data={
                'created_by': user,
                'opponent': user_to_fight,
                'name': room_name,
                'friendly' : friendly,
                'level' : CustomUser.calculate_level(user)
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
        user = CustomUser.objects.get(username=request.user)
        
        # Filter the RoomName queryset to only include rooms created by the user's friends or by the request.user, and where public is True
        try:
            friendslist = FriendList.objects.get(user=user)
            friends = friendslist.friends.all()
            rooms = RoomName.objects.filter(friendly=True).filter(Q(created_by__in=friends, opponent=user) | Q(created_by=user) | Q(opponent=user))
        except ObjectDoesNotExist:
            rooms = RoomName.objects.filter(Q(opponent=user) | Q(friendly=False))


        
        serializer = RoomNameSerializer(rooms, many=True)
        return Response(serializer.data)

class MatchmakingView(View):
    def get(self, request, *args, **kwargs):
        user = request.user
        user_level = user.calculate_level()

        existing_room = RoomName.objects.filter(Q(created_by=user) | Q(opponent=user)).first()
        if existing_room:
            opponent = existing_room.created_by.username if user != existing_room.opponent.username else existing_room.opponent.username
            return JsonResponse({"status": 2, "room_name": existing_room.name, "opponent" : opponent})


        # If the user is already in the waiting list, return 1
        if WaitingUser.objects.filter(user=user).exists():
            return JsonResponse({"status": 1})

        # Add the user to the waiting list
        WaitingUser.objects.create(user=user, level=user_level)

        # Get the list of waiting users, excluding the current user
        waiting_users = WaitingUser.objects.exclude(user=user)

        # Try to find a match for the user
        for waiting_user in waiting_users:
            level_difference = abs(user_level - waiting_user.level)

            # If the level difference is less than or equal to 2, start the match
            if level_difference <= 5:
                # Remove the users from the waiting list
                WaitingUser.objects.filter(user__in=[user, waiting_user.user]).delete()

                # Create a new room for the match
                room_name = str(uuid.uuid4())
                room = RoomName.objects.create(name=room_name, created_by=user, opponent=waiting_user.user)

                # Return the room name and the status 2
                return JsonResponse({"status": 2, "room_name": room_name, "opponent" : waiting_user.user.username})

        # If no match was found, return 1
        return JsonResponse({"status": 1})
    
class RoundTorunament(View):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)
    def get(self, request):
        try:
            round = TournamentPlaceHolder.objects.get(status=False)
        except ObjectDoesNotExist:
            return JsonResponse({"round": "No round"})
        return JsonResponse({"round": round.round})

class TournamentView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request):
        user = request.user
        tournament = None
        try :
            tournament = TournamentPlaceHolder.objects.get(status=True)
        except ObjectDoesNotExist:
            tournament = None
        serializer = TournamentPlaceHolderSerializer(tournament)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WaitingForTournameView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request):
        user = request.user
        waiting_queue = None
        list = {}
        i = 0
        try :
            waiting_queue = Tournament_Waitin.objects.all()
            for waiting in waiting_queue:
                serializer = UserInfoSerializer(waiting.user)
                list[f'{i}'] = [serializer.data, waiting.level]
                i += 1
        except ObjectDoesNotExist:
            tournament = None
        return JsonResponse(list, status=status.HTTP_200_OK)
    
class TournamentMatchView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request):
        user = CustomUser.objects.get(username=request.user)
        match = RoomName.objects.get(Q(created_by=user) | Q(opponent=user))
        serializer = RoomNameSerializer(match)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TournamentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        number = request.data.get("playerNumber", None)
        name = request.data.get("name", None)
        try:
            placeholder = TournamentPlaceHolder.objects.get(Q(status=True) | Q(status=False))
            if placeholder is not None:
                return Response({"Status" : "Tournament already exists. Only one Tournament at a time is permitted."}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist:
            pass
        serializer = TournamentPlaceHolderSerializer(data={
            "playerNumber": number,
            "status": True,
            "round": 0,
            "name": name
        })
        if serializer.is_valid():
            serializer.save()
            send_save_notification("all", f"{request.user.username} has created a tournament!") # Send a notification to the All user, to fix
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Create your views here.
@login_required
def pong(request, room_name):
    return render(request, "pong/pong.html", {"room_name": room_name, "users": request.user.username})