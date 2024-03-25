from django.urls import path

from .views import send_friend_request, SendFriendRequestView, ListFriendRequestView, accept_friend_request, ListFriendsView, ex

urlpatterns = [
    # path('friend_request/', send_friend_request, name="friend_request")
    path('request/send/', SendFriendRequestView.as_view(), name='send'),
    path('request/list/', ListFriendRequestView.as_view(), name='list'),
    path('accept/<str:friend_request_id>/', accept_friend_request, name='accept'),
    path('list/', ListFriendsView.as_view()),
    path("", ex, name="index"),
]