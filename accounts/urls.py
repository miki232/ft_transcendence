from django.urls import path
from .views import SignUpView, redirect_to_42, callback

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('authorize/', redirect_to_42, name='authorize'),
    path('callback/', callback, name='callback')
]
