# accounts/views.py
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

import secrets
import requests
import re
import imghdr
import urllib
import os
import uuid
import environ

from .forms import CustomUserCreationForm
from .models import CustomUser
from django.db.models import Q
from chat.models import Chat_RoomName, Message
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSignupSerializer, LoginSerializer, UserInfoSerializer, UserMatchHistorySerializer
from friends.models import FriendList
env = environ.Env()
environ.Env.read_env()

class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

# random_state_string = secrets.token_urlsafe(16)

def redirect_to_42(request):
    # Get the host (domain)
    host = env('HOST')

    # Manually construct the absolute URI including the port
    redirect_uri = f"{host}/accounts/callback/"
    print(redirect_uri)
    code = request.GET.get('code')
    random_state_string = secrets.token_urlsafe()
    request.session['oauth_state'] = random_state_string

    params = {
        'client_id': env('42_CLIENT_ID'),
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'state': random_state_string,
        'scope': env('42_SCOPE'),
    }
    url = 'https://api.intra.42.fr/oauth/authorize?' + urllib.parse.urlencode(params)
    # return redirect(url)
    return JsonResponse({'url': url})

def callback(request):
    host = env('HOST')

    # Manually construct the absolute URI including the port
    redirect_uri = f"{host}/accounts/callback/"
    print(redirect_uri)
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    stored_state = request.session.pop('oauth_state', None)

    # Check if the states match
    if state != stored_state:  # Should be the same random string you used in redirect_to_42
        return HttpResponse('Invalid state', status=400)

    # Exchange the authorization code for an access token
    data = {
        'grant_type': 'authorization_code',
        'client_id': env('42_CLIENT_ID'),
        'client_secret': env('42_CLIENT_SECRET'),
        'code': code,
        'redirect_uri': redirect_uri,
    }
    response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
    response.raise_for_status()
    token = response.json()['access_token']

    # Now you can use the access token to make API requests
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
    response.raise_for_status()
    user_info = response.json()


    try:
        user = CustomUser.objects.get(username=user_info['login'], email=user_info.get('email', ''))
    except ObjectDoesNotExist:
    # Check if the user already exists in your database
        user = CustomUser.objects.create(
            username=user_info['login'],
            pro_pic=user_info['image']['link'], 
            email=user_info.get('email', ''),
            OAuth=True
        )
    except MultipleObjectsReturned:
        return HttpResponse('Multiple users with the same username', status=400)
    # Log the user in
    if user.OAuth:
        login(request, user)
        if (user.is_active):
            user.status_login = True
            user.save()
            return render(request, 'close_tab.html', {'error': 'logged in successfully'})
            # return JsonResponse({'status': 'success', 'message': 'User logged in successfully'})
        else:
            return render(request, 'close_tab.html', {'error': 'User is not active'})
    else:
        return render(request, 'close_tab.html', {'error': 'User with this email and username already exists'})


class UserSignupView(APIView):
    def post(self, request, format=None):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                if user:
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({"detail": "A user with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserLoginView(APIView):
    def post(self, request, format=None):
        #request.session.set_expiry(5) ##possiamo settare il time expire per il session id
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            if not request.data.get('remember_me', False):
                # If "remember_me" is not true, set the session to expire when the browser closes
                request.session.set_expiry(0)
            else:
                # If "remember_me" is true, set the session to expire in 2 weeks (1209600 seconds)
                request.session.set_expiry(1209600)
            # if not request.data.get('language', False):
            #     user.language = 'en'
            #     user.save()
            # else:
            #     user.language = request.data['language']
            #     user.save()
            return Response({"status": "Login successful"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class BlockUser(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)
    def post(self, request):
        username = request.data.get("username")
        user_to_block = CustomUser.objects.get(username=username)

        # Add user_to_block to the list of users blocked by the current user
        if user_to_block not in request.user.blocked_users.all():
            request.user.blocked_users.add(user_to_block)
        else:
            return JsonResponse({"message": "User already blocked."})

        # Find the chat room between the current user and user_to_block
        chat_room = Chat_RoomName.objects.filter(
            Q(user1=request.user, user2=user_to_block) | Q(user1=user_to_block, user2=request.user)
        ).first()

        # if chat_room:
        #     # Delete the messages in the chat room
        #     Message.objects.filter(name=chat_room).delete()

        return JsonResponse({"message": "User blocked successfully."})
    
class UnblockUser(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)
    def post(self, request):
        username = request.data.get("username")
        user_to_unblock = CustomUser.objects.get(username=username)
        request.user.blocked_users.remove(user_to_unblock)
        return JsonResponse({"message": "User unblocked successfully."})

class UserBlockListView(APIView):   
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)
    def get(self, request):
        blocked_users = request.user.blocked_users.all()
        return JsonResponse({"blocked_users": [user.username for user in blocked_users]})

class UserdeleteView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        if self.request.user.is_authenticated:
            request.user.delete()
            return Response({'value' : 'User deleted'}, status=status.HTTP_200_OK)
        return Response({'value' : 'User not authenticated'}, status=status.HTTP_400_BAD_REQUEST)

def is_valid_image_url(url):
    try:
        response = requests.get(url, stream=True)
        if 'image' in response.headers['Content-Type']:
            return True
        else:
            return False
    except requests.exceptions.RequestException as e:
        # This means something went wrong (like a 404 error, etc.)
        return False

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request):
        serializer = UserInfoSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request):
        try:
            if 'defaultPic' in request.data['pro_pic']:
                request.data['pro_pic'] = request.user._meta.get_field('pro_pic').get_default()
        except KeyError:
            pass
        serializer = UserInfoSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def post(self, request):
        url = request.user.pro_pic
        if 'url' in request.POST:
            image_url = request.POST['url']
            if re.search('<.*?>', image_url):
                return JsonResponse({'error': 'Invalid input'}, status=400)
            if not is_valid_image_url(image_url):
                return JsonResponse({'error': 'Invalid URL'}, status=400)
            validate = URLValidator()
            try:
                validate(image_url)
            except ValidationError:
                return JsonResponse({'error': 'Invalid URL'}, status=400)
            current_pic_path = os.path.join(settings.BASE_DIR, request.user.pro_pic.lstrip('/'))
            if os.path.isfile(current_pic_path):
                os.remove(current_pic_path)
            request.user.pro_pic = escape(image_url)
            request.user.save()
            url = request.user.pro_pic
        elif 'imageFile' in request.FILES:
            uploaded_file = request.FILES['imageFile']
            if imghdr.what(uploaded_file) is None:
                return Response({'Error' : "Uploaded file is not an image!"}, status=status.HTTP_400_BAD_REQUEST)
            fs = FileSystemStorage(location='media/profilepics/')
            ext = uploaded_file.name.split('.')[-1]
            filename = '{}.{}'.format(uuid.uuid4(), ext)
            name = fs.save(filename, uploaded_file)
            name = 'profilepics/' + name
            url = fs.url(name)
            current_pic_path = os.path.join(settings.BASE_DIR, request.user.pro_pic.lstrip('/'))
            if os.path.isfile(current_pic_path):
                os.remove(current_pic_path)
            request.user.pro_pic = url
            request.user.save()
        elif 'pong_color' in request.data:
            request.user.pong_color = request.data['pong_color']
            request.user.save()
        elif 'paddle_color' in request.data:
            print("Paddle Color", request.data['paddle_color'])
            request.user.paddle_color = request.data['paddle_color']
            request.user.save()
        elif 'language' in request.data:
            request.user.language = request.data['language']
            request.user.save()
        else:
            return Response({'Error' : "Qualcosa e' andato storto!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'pro_pic': url, 'paddle_color' : request.user.paddle_color}, status=status.HTTP_200_OK)

class UserMatchHistoryView(generics.ListAPIView):
    serializer_class = UserMatchHistorySerializer

    def get_queryset(self):
        username = self.request.query_params.get('username', None)
        if username is not None:
            return CustomUser.objects.filter(username=username)
        return CustomUser.objects.none()

class GenericUserInfo(generics.ListAPIView):
    serializer_class = UserInfoSerializer

    def get(self, request, *args, **kwargs):
        username = self.request.query_params.get('username', None)
        if username is not None:
            try:
                friend_list = FriendList.objects.get(user=self.request.user)
            except ObjectDoesNotExist:
                friend = CustomUser.objects.get(username=username)
                serializer = self.get_serializer(friend)
                
                return Response({
                    'is_mutual_friend': False,
                    'user': serializer.data,
                })

            friend = CustomUser.objects.get(username=username)
            is_mutual_friend = friend_list.is_mutual_friend(friend)

            # Serialize the friend
            serializer = self.get_serializer(friend)

            # Return the serialized friend and the is_mutual_friend information
            return Response({
                'is_mutual_friend': is_mutual_friend,
                'user': serializer.data,
            })

        return Response(status=404)

class LogoutView(APIView):
    def post(self, request):
        request.user.status_login = False
        request.user.save()
        logout(request)
        return Response({'value' : 'logged out'}, status=status.HTTP_200_OK)
    
class UserSearchView(generics.ListAPIView):
    serializer_class = UserInfoSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        print("Get Query Set 213", query)
        if query is not None:
            print("Get Query Set 215", query)
            return CustomUser.objects.filter(username__icontains=query)
        return CustomUser.objects.none()

    # def list(self, request, *args, **kwargs):
    #     queryset = self.filter_queryset(self.get_queryset())
    #     if not queryset:
    #         return Response({"User not Found"}, status=status.HTTP_404_NOT_FOUND)

    #     page = self.paginate_queryset(queryset)
    #     if page is not None:
    #         serializer = self.get_serializer(page, many=True)
    #         return self.get_paginated_response(serializer.data)

    #     serializer = self.get_serializer(queryset, many=True)
    #     return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return Response({"User not Found"}, status=status.HTTP_404_NOT_FOUND)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            for item in data:
                friendlist = FriendList.objects.get(user=request.user)
                user_friend = CustomUser.objects.get(username=item['username'])
                print("List 244", friendlist.is_mutual_friend(item['username']), friendlist.user.username)
                if friendlist.is_mutual_friend(item['username']):  # Replace with your actual check
                    item.pop('status_login', None)
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for item in data:
            try:
                friendlist = FriendList.objects.get(user=request.user)
            except ObjectDoesNotExist:
                item.pop('status_login', None)
                continue
            user_friend = CustomUser.objects.get(username=item['username'])
            print("List 258", item['username'], user_friend.username, friendlist.is_mutual_friend(user_friend), friendlist.user.username)
            if friendlist.is_mutual_friend(user_friend) == False:  # Replace with your actual check
                item.pop('status_login', None)
        return Response(data)