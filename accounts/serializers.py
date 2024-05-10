from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.conf import settings

import os

from .models import CustomUser, Match

class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}
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
                    user.status_login = "online"
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
    newpassword = serializers.CharField(write_only=True, required=False)
    confirmpassword = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'pro_pic', "status_login", 'is_active', 'newpassword', 'confirmpassword')
    
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

    def to_representation(self, instance):
        request = self.context.get('request')
        self.set_default_pic(instance)
        return super().to_representation(instance)
        
    def validate_newpassword(self, value):
        validate_password(value)
        return value

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if 'newpassword' in validated_data:
            if ('confirmpassword' not in validated_data) or (validated_data['newpassword'] != validated_data['confirmpassword']):
                raise serializers.ValidationError("Passwords do not match.")
            instance.password = make_password(validated_data.pop('newpassword'))
        if (request and 'pro_pic' in request.data and request.data['pro_pic'] == instance._meta.get_field('pro_pic').get_default()
            and instance.pro_pic != instance._meta.get_field('pro_pic').get_default()):
            print("Default Pic")
            validated_data['pro_pic'] = instance._meta.get_field('pro_pic').get_default()
            pro_pic_path = os.path.join(settings.BASE_DIR, instance.pro_pic.lstrip('/'))
            print(pro_pic_path)
            if os.path.exists(pro_pic_path):
                print("DELETED")
                os.remove(pro_pic_path)
        return super().update(instance, validated_data)
    
class UserMatchHistorySerializer(serializers.ModelSerializer):
    match_history = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'pro_pic', 'match_history')

    def get_match_history(self, obj):
        return obj.get_match_history()
    