from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings

import os
import time
import redis

from .models import CustomUser, Match
from friends.models import FriendList

r = redis.Redis(host='redis', port=6379, db=0)  # Connect to your Redis instance

class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_username(self, value):
        if len(value) > 15:  # Change this number to the maximum length you want
            raise serializers.ValidationError("The username is too long.")
        return value
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    
    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        user, created = CustomUser.objects.get_or_create(
            username=validated_data['username'],
            defaults={'email': validated_data.get('email', '')}
        )
        if created:
            user.set_password(validated_data['password'])
            user.save()
        return user
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, data):
        username = data.get('username', None)
        password = data.get('password', None)

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    user.status_login = True
                    user.save()
                    data['user'] = user
                else:
                    msg = "User is deactivated."
                    raise serializers.ValidationError(msg)
            else:
                msg = "Unable to login with provided credentials."
                raise serializers.ValidationError(msg)
        else:
            msg = "Must provide username and password both."
            raise serializers.ValidationError(msg)
        return data

class UserInfoSerializer(serializers.ModelSerializer):
    username = serializers.CharField(allow_blank=True, required=False)
    alias = serializers.CharField(allow_blank=True, required=False)
    newpassword = serializers.CharField(write_only=True, required=False)
    confirmpassword = serializers.CharField(write_only=True, required=False)
    level = serializers.SerializerMethodField()
    wins = serializers.SerializerMethodField()
    losses = serializers.SerializerMethodField()
    exp = serializers.SerializerMethodField()
    status_login = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'pro_pic', "status_login", 'is_active', 'newpassword', 'confirmpassword', 'level' , 'wins', 'losses', 'exp', 'paddle_color', 'pong_color', 'alias', 'language')
    
    def validate_username(self, value):
        if len(value) > 15:  # Change this number to the maximum length you want
            raise serializers.ValidationError("The username is too long.")
        return value
    
    def get_exp(self, obj):
        return obj.calculate_exp()[0]
    
    def get_wins(self, obj):
        return obj.calculate_exp()[1]
    
    def get_losses(self, obj):
        return obj.calculate_exp()[2]
    
    def get_level(self, obj):
        return obj.calculate_level()
    
    def set_default_pic(self, instance):
        """
        Prevent the "Not Found" Error, when the User Pic is accidentally deleted.
        """
        pro_pic_path = os.path.join(settings.BASE_DIR, instance.pro_pic.lstrip('/'))
        if (not os.path.exists(pro_pic_path)) and (instance.pro_pic != instance._meta.get_field('pro_pic').get_default()):
            if ('http' in instance.pro_pic):
                return
            instance.pro_pic = instance._meta.get_field('pro_pic').get_default()
            instance.save()

    def get_status_login(self, obj):
        return obj.is_user_online(obj.id)
    
    def to_representation(self, instance):
        self.set_default_pic(instance)
        representation = super().to_representation(instance)
        request = self.context.get('request')
        try:
            username = request.query_params.get('username', None)
            if username is None:
                return representation
        except AttributeError:
            return representation
        print("To Representation 109", "BOOOOOOOOOOOOOOOOOOO ",username, request.user)
        if request and request.user.is_authenticated:
            try:
                friend_list = FriendList.objects.get(user=request.user)
            except ObjectDoesNotExist:
                representation.pop('status_login')
                return representation
            friend = CustomUser.objects.get(username=username)
            is_mutual_friend = friend_list.is_mutual_friend(friend)
            if is_mutual_friend == False:
                representation.pop('status_login')
            # else:
            #     representation['status_login'] = self.is_user_online(friend.id)
        return representation
        
    def validate_newpassword(self, value):
        validate_password(value)
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # print("Update 131", validated_data, validated_data['username'].strip(), ('username' in validated_data and len(validated_data['username']) > 0))  # Debugging
        if 'username' in validated_data and validated_data['username'].strip():
            print("Update 144", "Username")  # Debugging
            instance.username = validated_data['username']
        else:
            validated_data.pop('username', None)
        if 'newpassword' in validated_data:
            if ('confirmpassword' not in validated_data) or (validated_data['newpassword'] != validated_data['confirmpassword']):
                raise serializers.ValidationError("Passwords do not match.")
            instance.password = make_password(validated_data.pop('newpassword'))
        if 'alias' in validated_data  and validated_data['alias'].strip():
            print("Update 147", len(validated_data['alias']), "Alias")  # Debugging
            if len(validated_data['alias']) > 15:
                raise serializers.ValidationError("The alias is too long.")
            else:
                instance.alias = validated_data['alias']
        else:
            validated_data.pop('alias', None)
        if (request and 'pro_pic' in request.data and request.data['pro_pic'] == instance._meta.get_field('pro_pic').get_default()
            and instance.pro_pic != instance._meta.get_field('pro_pic').get_default()):
            print("Update 136", "Default Pic")
            validated_data['pro_pic'] = instance._meta.get_field('pro_pic').get_default()
            pro_pic_path = os.path.join(settings.BASE_DIR, instance.pro_pic.lstrip('/'))
            print("Update 139", pro_pic_path)
            if os.path.exists(pro_pic_path):
                print("Update 141", "DELETED")
                os.remove(pro_pic_path)
        return super().update(instance, validated_data)
    
class UserMatchHistorySerializer(serializers.ModelSerializer):
    match_history = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'pro_pic', 'match_history')

    def get_match_history(self, obj):
        return obj.get_match_history()
    