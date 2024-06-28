from django.urls import path
from . import views
from pong.views import ListRoomView, DeleteRoomView, CreateRoomView, MatchmakingView, TournamentView, WaitingForTournameView, TournamentMatchView, RoundTorunament, TournamentCreateView, TournamentHistoryView, Search_TournamentMatchView, LocalTournamentView, GetLocalTournament_MatchView, GetLocalTournamentView, LocalTournamentMatch_OneView, LocalTournamentMatch_updateView, LocalTournamentSetWinner
from chat.views import ChatCreateView, ChatListView, Room_users_list
from accounts.views import BlockUser, UnblockUser, UserBlockListView
urlpatterns = [
    path("", views.index, name="index"),
    path('csrf-token', views.csrf, name='csrf'),
    path('about/', views.about, name="about"),
    path('block_user/', BlockUser.as_view(), name='block_user'),
    path('unblock_user/', UnblockUser.as_view(), name='unblock_user'),
    path('user_block_list/', UserBlockListView.as_view(), name='user_block_list'),
	path('room_users_list/', Room_users_list.as_view(), name='room_users_list'),
    path('contact/', views.contact, name='contact'),
    path('chat_create/', ChatCreateView.as_view(), name='chat'),
    path('chat_list/', ChatListView.as_view(), name='chat_list'),
    path('login/', views.login, name='login'),
    path('room/', views.room, name="room"),
    path('rooms_list/', ListRoomView.as_view(), name='rooms_list'),
    path('matchmaking/', MatchmakingView.as_view(), name="matchmaking"),
    path('room_namelocal/', views.room_namelocal, name='room_namelocal'),
    path('liberate_room/', views.liberate_room, name='liberate_room'),
    path('tournament/', TournamentView.as_view(), name='tournament'),
    path('waiting_for_tournament/', WaitingForTournameView.as_view(), name='waiting_for_tournament'),
    path('tournament_match/', TournamentMatchView.as_view(), name='tournament_match'),
    path('round/', RoundTorunament.as_view(), name='round_tournament'),
    path('tournament_create/', TournamentCreateView.as_view(), name='tournament_create'),
    path('delete_room/', DeleteRoomView.as_view(), name='delete_room'),
    path('tournament_history/', TournamentHistoryView.as_view(), name='tournament_history'),
    path('user_tournament/', Search_TournamentMatchView.as_view(), name='search_tournament_match'),
	path('sanity/', views.SanitizeView.as_view(), name='sanitize'),
	path('createlocal_tournament/', LocalTournamentView.as_view(), name='local_tournament'),
	path('getlocal_tournament_match/', GetLocalTournament_MatchView.as_view(), name='getlocal_tournament_match'),
	path('getlocal_tournament/', GetLocalTournamentView.as_view(), name='getlocal_tournament'),
	path('local_tournament_one_update/', LocalTournamentMatch_OneView.as_view(), name='local_tournament_match_one'),
	path('local_tournament_update/', LocalTournamentMatch_updateView.as_view(), name='local_tournament_match_update'),
	path('local_tournament_set_winner/', LocalTournamentSetWinner.as_view(), name='local_tournament_set_winner'),
    # path('rooms/create/', CreateRoomView.as_view(), name='create_room'), #spostato in pong/urls.py
    path("test/", views.test, name="test"),
]