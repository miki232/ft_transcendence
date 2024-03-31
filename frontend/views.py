from django.shortcuts import render
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


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
    return render(request, "home2.html")

@login_required
def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})