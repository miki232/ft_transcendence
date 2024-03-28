from django.db import models
from django.conf import settings
from django.utils import timezone
# Create your models here.

class FriendList(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user')
    friends = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='friends')

    def __str__(self):
        return self.user.username

    def add_friend(self, account):
        if not account in self.friends.all():
            self.friends.add(account)

    def remove_friend(self, account):
        if account in self.friends.all():
            self.friends.remove(account)
    
    def unfriend(self, friend_to_remove):
        user_want_to_remove_list = self #la persona che vuole terminare l'amicizia con friend_to_remove
        user_want_to_remove_list.remove_friend(friend_to_remove)

        friend_list = FriendList.objects.get(user=friend_to_remove)
        friend_list.remove_friend(self.user)

    def is_mutual_friend(self, friend):
        if friend in self.friends.all():
            return True
        return False
    

class FriendRequest(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver')
    is_active = models.BooleanField(blank=True, null=False, default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.sender.username
    
    def accept(self):
        receiver_friend_list, created = FriendList.objects.get_or_create(user=self.receiver)
        if self.sender not in receiver_friend_list.friends.all():
            receiver_friend_list.friends.add(self.sender)
            sender_friend_list, created = FriendList.objects.get_or_create(user=self.sender)
            if self.receiver not in sender_friend_list.friends.all():
                sender_friend_list.add_friend(self.receiver)
                self.is_active = False
                self.save()
        self.delete()

    # def accept(self):
    #     receiver_friend_list = FriendList.objects.get(user=self.receiver)
    #     if receiver_friend_list:
    #         receiver_friend_list.add_friend(self.sender)
    #         sender_friend_list = FriendList.objects.get(user=self.sender)
    #         if sender_friend_list:
    #             sender_friend_list.add_friend(self.receiver)
    #             self.is_active = False
    #             self.save()

    def update(self):
        self.is_active = True
        self.save()

    def decline(self):
        self.is_active = False
        self.save()
        self.delete()

    def cancel(self): #se io decido di eliminare una richiesta di amicizia
        self.is_active = False
        self.save()
        self.delete()