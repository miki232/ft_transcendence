from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json

from accounts.models import CustomUser
from .models import FriendRequest
from .serializers import FriendRequestSerializer
# Create your views here.


def send_friend_request(request):
    user = request.user
    payload = {}
    print(user.is_authenticated)
    if request.method == "POST" and user.is_authenticated:
        user_id = request.POST.get("receiver_user_id")
        if user_id:
            receiver = CustomUser.objects.get(pk=user_id)
            try:
                friend_request = FriendRequest.objects.filter(sender=user, receiver=receiver)
                try:
                    for request in friend_request:
                        if request.is_active:
                            raise Exception("Alredy send")
                    friend_request = FriendRequest(sender=user, receiver=receiver)
                    friend_request.save()
                    payload['response'] = "Friend request sent"
                except Exception as e:
                    payload['response'] = str(e)
            except FriendRequest.DoesNotExist:
                friend_request = FriendRequest(sender=user, receiver=receiver)
                friend_request.save()
                payload['response'] = "Friend request sent"

            if payload['response'] == None:
                payload["response"] = "Something went wrong"
        else:
            payload["response"] = "Unable to send request"
    else:
        payload["response"] = "Bro Non sei loggato come hai fatto?"
    return HttpResponse(json.dumps(payload), content_type="application/json")

# views.py

class SendFriendRequestView(APIView):
    def post(self, request):
        user = request.user
        receiver_id = request.data.get('receiver_user_id')
        if receiver_id:
            receiver = CustomUser.objects.get(username=receiver_id)
            friend_request, created = FriendRequest.objects.get_or_create(sender=user, receiver=receiver)
            if created:
                serializer = FriendRequestSerializer(friend_request)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({"detail": "Friend request already exists"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": "Unable to send request"}, status=status.HTTP_400_BAD_REQUEST)