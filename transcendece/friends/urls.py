from django.urls import path

from .views import send_friend_request, SendFriendRequestView, ListFriendRequestView, accept_friend_request, ListFriendsView, ex, RemoveFriend, DeclineFriendRequestView, CancelFriendRequestView

urlpatterns = [
    path('request/send/', SendFriendRequestView.as_view(), name='send'),
    path('request/list/', ListFriendRequestView.as_view(), name='list'),
    path('request/decline/', DeclineFriendRequestView.as_view(), name="decline"),
    path('request/cancel/', CancelFriendRequestView.as_view(), name="cancel"),
    path('accept/<str:friend_request_id>/', accept_friend_request, name='accept'),
    path('remove/', RemoveFriend.as_view(), name='remove'),
    path('list/', ListFriendsView.as_view()),
    path("", ex, name="index"),
]
# Cookie: csrftoken=7lWHe8p7wIvnkp01XirNaZMwUWfXkZGI; sessionid=5refcxpy6eyfbfek6pevnqi24b442fb1
# Cookie: csrftoken=7lWHe8p7wIvnkp01XirNaZMwUWfXkZGI; sessionid=5refcxpy6eyfbfek6pevnqi24b442fb1
# X-CSRFTOKEN: 7zIFVje9FKuGh67F6NdbtKqllVtpPseA4KucZht61iPTrlXwTVuOtz2H5HycZhK8
# X-CSRFToken: null