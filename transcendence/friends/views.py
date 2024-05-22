from django.shortcuts import render
from django.db.models import Q
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from chat.notifier import send_save_notification, get_db, update_db_notifications
from accounts.models import CustomUser
from .models import FriendRequest, FriendList
from .serializers import FriendRequestSerializer, FriendListSerializer
# Create your views here.

def send_friend_request(request):
    user = request.user
    payload = {}
    print("Send Friend Request 20", user.is_authenticated)
    print("SUCAAAAAA")

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
                print("SUCAAAAAA")
                payload['response'] = "Friend request sent"

            if payload['response'] == None:
                payload["response"] = "Something went wrong"
        else:
            payload["response"] = "Unable to send request"
    else:
        payload["response"] = "Bro Non sei loggato come hai fatto?"
    return HttpResponse(json.dumps(payload), content_type="application/json")

# views.py

class ListFriendRequestView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated:
            friend_request = FriendRequest.objects.filter(Q(sender=user) | Q(receiver=user), is_active=True)
            serializer = FriendRequestSerializer(friend_request, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Non sei loggato Bro"}, status=status.HTTP_400_BAD_REQUEST)

# class SendFriendRequestView(APIView):
#     def post(self, request):
#         if request.user.is_authenticated:
#             user = request.user
#             receiver_id = request.data.get('receiver_user_id')
#             if receiver_id:
#                 receiver = CustomUser.objects.get(username=receiver_id)
#                 try:
#                     friend_request = FriendRequest.objects.filter(
#                     Q(sender=user, receiver=receiver, is_active=True) |
#                     Q(sender=receiver, receiver=user, is_active=True)
#                     )
#                     if friend_request.exists():
#                         raise Exception("Friend request alredy exists")
                    
#                     friend_request = FriendRequest(sender=user, receiver=receiver)
#                     friend_request.save()
#                     serializer = FriendRequestSerializer(friend_request)
#                     return Response(serializer.data, status=status.HTTP_201_CREATED)
#                 except Exception as e:
#                     return Response(e, status=status.HTTP_400_BAD_REQUEST)
#             else:
#                 return Response({"detail": "Unable to send request"}, status=status.HTTP_400_BAD_REQUEST)

    

class SendFriendRequestView(APIView):
    def post(self, request):
        # Check if user is authenticated

        print("Post - Send Friend Request 95", request.user.is_authenticated, request.user.username, request.data.get('receiver_user_id'))
        if request.user.is_authenticated and request.user.username != request.data.get('receiver_user_id'):
            user = request.user
            receiver_id = request.data.get('receiver_user_id')
            # Check if receiver_id is provided
            if receiver_id:
                receiver = CustomUser.objects.get(username=receiver_id)
                try:
                    friend_list = FriendList.objects.get(user=user)

                    #check if are alredy friend
                    if friend_list.is_mutual_friend(receiver):
                        return Response({"detail": "Users are already friends"}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        raise Exception
                except:                    
                    try:
                        # Check if a friend request already exists in either direction
                        friend_request = FriendRequest.objects.filter(
                            Q(sender=user, receiver=receiver, is_active=True) |
                            Q(sender=receiver, receiver=user, is_active=True)
                        )
                        
                        if friend_request.exists():
                            return Response("Friend request already exists", status=status.HTTP_429_TOO_MANY_REQUESTS)
                    
                        # If no friend request exists, create a new one
                        friend_request = FriendRequest(sender=user, receiver=receiver)
                        friend_request.save()
                        print("Post - Send Friend Request 124", f"Sending message to group notifications_{receiver.id}")
                        print("Post - Send Freiend Request 125", receiver.id)
                        send_save_notification(receiver, f"You have a new friend request from {user.username}")
                        # async_to_sync(send_message)(receiver.id)
                                # break  # If the group_send call succeeds, break out of the loop
                        print("Post - Send Friend Request 129", f"Message sent to group notifications_{receiver.id}")
                        # Serialize the friend request and return it
                        serializer = FriendRequestSerializer(friend_request)
                        return Response(serializer.data, status=status.HTTP_201_CREATED)

                    except Exception as e:
                        # If an error occurs, return it
                        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
            else:
                # If receiver_id is not provided, return an error
                return Response({"detail": "Unable to send request"}, status=status.HTTP_400_BAD_REQUEST)
        # If user is not authenticated, return an error
    
        return Response({"detail": "You must be authenticated to send a friend request."}, status=status.HTTP_403_FORBIDDEN)

"""FARE ATTENZIONE CHE RECEIVER E USER SONO VARIABILI INVERTITE
    RECEIVER è IN REALTà L'utente che invia la richiesta "Sender"
    Sender è in realtà l'utente che riceve "RECEIVER
"""
def accept_friend_request(request, *args, **kwargs):
     user = request.user
     payload = {}

     if request.method == "GET" and user.is_authenticated:
         friend_request_id = kwargs.get("friend_request_id")
         receiver = CustomUser.objects.get(username=friend_request_id)
         print("Accept Friend Request 155", friend_request_id, receiver)
         if friend_request_id:
            friend_request = FriendRequest.objects.get(sender=receiver, receiver=user)
			# confirm that is the correct request
            if friend_request.receiver == user:
                if friend_request: 
					# found the request. Now accept it
                    updated_notification = friend_request.accept()
                    update_db_notifications(receiver, user)
                    payload['response'] = "Friend request accepted."
                else:
                    payload['response'] = "Something went wrong."
            else:
                payload['response'] = "That is not your request to accept."
         else:
             payload['response'] = "Unable to accept that friend request."
     else:
		# should never happen
        payload['response'] = "You must be authenticated to accept a friend request."
     return HttpResponse(json.dumps(payload), content_type="application/json")


#{"friend_request_id" : "Sucamilla"}

class ListFriendsView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated:
            friends = FriendList.objects.filter(user=user)
            serializer = FriendListSerializer(friends, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "You must be logged in"}, status=status.HTTP_400_BAD_REQUEST)
        
class RemoveFriend(APIView):
    def post(self, request):
        user = request.user
        if user.is_authenticated:
            friend_2_remove_id = request.data.get('receiver_user_id')
            if friend_2_remove_id:
                try:
                    removee = CustomUser.objects.get(username=friend_2_remove_id)
                    friend_list = FriendList.objects.get(user=user)
                    friend_list.unfriend(removee)
                    return Response({"detail" : "Removed successfully"}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({"detail" : str(e)}, status=status.HTTP_200_OK)
            else:
                return Response({"detail" : "Erro Unable to remove Friend"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail" : "Brooo Devi essere loggato "}, status=status.HTTP_403_FORBIDDEN)


class DeclineFriendRequestView(APIView):
    def post(self, request):
        user = request.user
        if user.is_authenticated:
            friend_request_id_to_decline=  request.data.get('sender_user_id')
            print("Post - Decline Friend Request 213", friend_request_id_to_decline)
            if friend_request_id_to_decline:
                try:
                    removee = CustomUser.objects.get(username=friend_request_id_to_decline)
                    friend_request = FriendRequest.objects.get(sender=removee, receiver=user)
                    if friend_request.receiver == user:
                        if friend_request:
                            friend_request.decline()
                            update_db_notifications(removee, user)
                            return Response({"detail" : "Request declined Successfully"}, status=status.HTTP_200_OK)
                        else:
                            return Response({"detail" : "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        return Response({"detail" : "This is not your Friend request to decline"}, status=status.HTTP_401_UNAUTHORIZED)
                except Exception as e:
                    print("Post - Decline Friend Request 228", str(e))
                    return Response({"detail" : str(e)}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"detail" : "Bro Devi essere Loggato!"}, status=status.HTTP_403_FORBIDDEN)


class CancelFriendRequestView(APIView):
    def post(self, request):
        user = request.user
        if user.is_authenticated:
            friend_request_id_to_cancel=  request.data.get('receiver_user_id')
            print("Post - Cancel Friend Request 239", friend_request_id_to_cancel)
            if friend_request_id_to_cancel:
                try:
                    removee = CustomUser.objects.get(username=friend_request_id_to_cancel)
                    friend_request = FriendRequest.objects.filter(sender=user, receiver=removee, is_active=True)
                    if friend_request:
                        if friend_request.first().sender == user:
                                friend_request.first().cancel()
                                update_db_notifications(user, removee)
                                return Response({"detail" : "Request Cancel Successfully"}, status=status.HTTP_200_OK)
                        else:
                            return Response({"detail" : "This is not your Friend request to cancel"}, status=status.HTTP_401_UNAUTHORIZED)
                    else:
                        return Response({"detail" : "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    print("Post - Cancel Friend Request 254", str(e))
                    return Response({"detail" : str(e)}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"detail" : "Bro Devi essere Loggato!"}, status=status.HTTP_403_FORBIDDEN)

def ex(request):
    return render(request, "friend_example.html")