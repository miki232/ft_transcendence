from django.urls import path
from . import views

urlpatterns = [
    # path("", views.index, name='index'),
    path('callback/', views.callback, name='callback'),
    path('authorize/', views.redirect_to_42, name='authorize'),
    path("", views.room, name='room'),
]