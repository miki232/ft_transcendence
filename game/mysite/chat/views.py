from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings
import requests
import urllib

def redirect_to_42(request):
    params = {
        'client_id': 'u-s4t2ud-d68d311ff703e880fe4e53fb5bd960c20e23a249ed0a9d234d3976e75bd70b33',
        'redirect_uri': request.build_absolute_uri('/callback'),
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
        'redirect_uri': request.build_absolute_uri('/callback'),
    }
    response = requests.post('https://api.intra.42.fr/oauth/token', data=data)
    response.raise_for_status()
    token = response.json()['access_token']

    # Now you can use the access token to make API requests

    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
    response.raise_for_status()
    user_info = response.json()
    # print(user_info)

    return HttpResponse(f'Hello, {user_info["login"]}!')

# Create your views here.
def index(request):
    return render(request, "chat/index.html")

def room(request):
    return render(request, "chat/room.html")
