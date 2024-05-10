from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Match
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password

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
    
    def validate_newpassword(self, value):
        validate_password(value)
        return value

    def update(self, instance, validated_data):
        if 'newpassword' in validated_data:
            if ('confirmpassword' not in validated_data) or (validated_data['newpassword'] != validated_data['confirmpassword']):
                raise serializers.ValidationError("Passwords do not match.")
            instance.password = make_password(validated_data.pop('newpassword'))
        return super().update(instance, validated_data)
    
class UserMatchHistorySerializer(serializers.ModelSerializer):
    match_history = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'pro_pic', 'match_history')

    def get_match_history(self, obj):
        return obj.get_match_history()
    