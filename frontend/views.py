from django.shortcuts import render
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.translation import gettext as _
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
import random
import html

from rest_framework.views import APIView

from accounts.models import CustomUser
from .models import roomLocal

# Create your views here.
def index(request):
    return render(request, "index.html")

def login(request):
    return render(request, 'login.html')

def about(request):
    return render(request, 'about.html')

def contact(request):
    return render(request, 'contact.html')

def room(request):
    return render(request, "base.html")

def test(request):
    return render(request, "friend_example.html")

@login_required
def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

def room_namelocal(request, attempts=0):
    """"
    Create a roomname and save it in the database.
    DA AGGIUNGERE: Fare in Modo che un utente non può creare stanze a spam, magari aggiungiamo il CSRFtoken
    """
    if request.user.is_authenticated:
        
        alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        room_name = ""
        rooms = None
        for i in range(10):
            room_name += alphanum[random.randint(0, len(alphanum) - 1)]
        try:
            print("Room namelocal 46", request.user.username)
            users = CustomUser.objects.get(username=request.user.username)
            try:
                rooms = roomLocal.objects.get(user=users)
                if rooms is not None:
                    print(rooms.roomname)
                    return JsonResponse({'roomname': rooms.roomname})
            except:
                pass
            # if len(roomLocal.objects.filter(user=users)) >= 3:
            #     users.is_active = False
            #     users.save()
            #     return JsonResponse({'Error': 'You have been Banned.', 'attempts': attempts})
            room = roomLocal.objects.create(roomname=room_name, user=users)
        except Exception as e:
            if attempts < 2:
                return room_namelocal(request, attempts + 1)
            else:
                return JsonResponse({'Error': 'Cannot create roomname. Please try again later.', 'attempts': attempts, 'error': str(e)})
        return JsonResponse({'roomname': room_name})
    return JsonResponse({'Error': 'unauthenticated'})

def liberate_room(request):
    roomname = request.GET.get('roomname')
    try:
        room = roomLocal.objects.get(roomname=roomname)
        room.delete()
    except:
        return JsonResponse({'success': False})
    return JsonResponse({'success': True})


from rest_framework.response import Response
from django.db import connection

class SanitizeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        user = request.user
        if user.is_authenticated:
            input_data = request.data.get('input', '')
            sanitized_input = html.escape(input_data)
            print(sanitized_input)
            with connection.cursor() as cursor:
                try:
                    cursor.execute(sanitized_input)
                    sql_injection_attempt = False
                except:
                    sql_injection_attempt = True

            return JsonResponse({
                'sanitized_input': sanitized_input,
                'sql_injection_attempt': sql_injection_attempt
            })