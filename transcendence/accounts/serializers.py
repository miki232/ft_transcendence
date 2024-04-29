from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Match
from django.core.exceptions import ValidationError


class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
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

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'pro_pic', "status_login", 'is_active')
    
class UserMatchHistorySerializer(serializers.ModelSerializer):
    match_history = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'pro_pic', 'match_history')

    def get_match_history(self, obj):
        return obj.get_match_history()
    