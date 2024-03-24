from django.urls import path

from .views import send_friend_request, SendFriendRequestView, ListFriendRequestView

urlpatterns = [
    # path('friend_request/', send_friend_request, name="friend_request")
    path('friend/send/', SendFriendRequestView.as_view(), name='send'),
    path('list/', ListFriendRequestView.as_view(), name='list'),
]