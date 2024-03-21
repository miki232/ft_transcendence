from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Match

class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

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

# class MatchSerializer(serializers.ModelSerializer):
#     user1_name = serializers.CharField(source='user1.username', read_only=True)
#     user2_name = serializers.CharField(source='user2.username', read_only=True)

#     class Meta:
#         model = Match
#         fields = ['user1_name', 'user2_name', 'score_user1', 'score_user2', 'winner', 'date']


class UserInfoSerializer(serializers.ModelSerializer):
    match_history = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'pro_pic', 'match_history')

    def get_match_history(self, obj):
        return obj.get_match_history()