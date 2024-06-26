from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser, Match
# Register your models here.

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['email', 'username'] # new
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if obj:
            fieldsets += (('Extra Fields', {'fields': ('pro_pic', 'Ai', 'Occupied', 'blocked_users')}),)
        return fieldsets

admin.site.register(Match) #new
admin.site.register(CustomUser, CustomUserAdmin) # new