# accounts/views.py
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponse
import requests
import urllib

from .forms import CustomUserCreationForm
from .models import CustomUser
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSignupSerializer, LoginSerializer, UserInfoSerializer

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
            user = serializer.save()
            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserLoginView(APIView):
    def post(self, request, format=None):
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
    

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'value' : 'logged out'}, status=status.HTTP_200_OK)