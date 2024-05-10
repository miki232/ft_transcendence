from django.urls import path
from .views import SignUpView, redirect_to_42, callback, UserSignupView, UserLoginView, UserInfoView, LogoutView, UserMatchHistoryView, GenericUserInfo, UserSearchView, UserdeleteView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup'),
    path('authorize/', redirect_to_42, name='authorize'),
    path('callback/', callback, name='callback'),
    path('register/', UserSignupView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('user_info/', UserInfoView.as_view(), name='user_info'),
    path('guser_info/', GenericUserInfo.as_view(), name='guser_info'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('match_history/', UserMatchHistoryView.as_view(), name='user_match_history'),
    path('search/', UserSearchView.as_view(), name="user_search"),
    path('delete/', UserdeleteView.as_view(), name='user_delete')
    # path('user/<str:username>/match_history/', UserMatchHistoryView.as_view(), name='user_match_history')
]
