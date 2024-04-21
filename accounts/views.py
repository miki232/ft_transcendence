# accounts/views.py
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist

import requests
import urllib
import os
import uuid

from .forms import CustomUserCreationForm
from .models import CustomUser
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSignupSerializer, LoginSerializer, UserInfoSerializer, UserMatchHistorySerializer
from friends.models import FriendList

class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

def redirect_to_42(request):
    params = {
        'client_id': 'u-s4t2ud-d68d311ff703e880fe4e53fb5bd960c20e23a249ed0a9d234d3976e75bd70b33',
        'redirect_uri': request.build_absolute_uri('/accounts/callback/'),
        'response_type': 'code',
        'state': 'random_state_string',  # Should be a random string
        'scope': 'public',
    }
    url = 'https://api.intra.42.fr/oauth/authorize?' + urllib.parse.urlencode(params)
    return redirect(url)

def callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')

    # Check if the states match
    if state != 'random_state_string':  # Should be the same random string you used in redirect_to_42
        return HttpResponse('Invalid state', status=400)

    # Exchange the authorization code for an access token
    data = {
        'grant_type': 'authorization_code',
        'client_id': 'u-s4t2ud-d68d311ff703e880fe4e53fb5bd960c20e23a249ed0a9d234d3976e75bd70b33',
        'client_secret': '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',
        'code': code,
        'redirect_uri': request.build_absolute_uri('/accounts/callback/'),
    }
    response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
    response.raise_for_status()
    token = response.json()['access_token']

    # Now you can use the access token to make API requests
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
    response.raise_for_status()
    user_info = response.json()

    # Check if the user already exists in your database
    # print(user_info['image']['link'])
    user, created = CustomUser.objects.get_or_create(
        username=user_info['login'],
        pro_pic=user_info['image']['link'],
        defaults={'email': user_info.get('email', '')}
    )

    # Log the user in
    login(request, user)

    # Redirect the user to a success page or any other appropriate page
    return redirect('/')

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
            return Response({"status": "Login successful"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def get(self, request):
        serializer = UserInfoSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request):
        print(request.data)
        serializer = UserInfoSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def post(self, request):
        url = request.user.pro_pic
        if 'url' in request.POST:
            print(request.POST)
            request.user.pro_pic = request.POST['url']
            request.user.save()
            print(request.user.pro_pic)
        elif 'imageFile' in request.FILE:
            uploaded_file = request.FILES['imageFile']
            fs = FileSystemStorage(location='media/profile_pics/')
            ext = uploaded_file.name.split('.')[-1]
            filename = '{}.{}'.format(uuid.uuid4(), ext)
            name = fs.save(filename, uploaded_file)
            name = 'profile_pics/' + name
            url = fs.url(name)
            request.user.pro_pic = url
            request.user.save()
        else:
            return Response({'Error' : "Qualcosa e' andato storto!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'pro_pic': url}, status=status.HTTP_200_OK)

    
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
        request.user.status_login = "Offline"
        request.user.save()
        logout(request)
        return Response({'value' : 'logged out'}, status=status.HTTP_200_OK)
    
class UserSearchView(generics.ListAPIView):
    serializer_class = UserInfoSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        print(query)
        if query is not None:
            print(query)
            return CustomUser.objects.filter(username__icontains=query)
        return CustomUser.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset:
            return Response({"User not Found"}, status=status.HTTP_404_NOT_FOUND)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)