from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import *



class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=True,)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ["username", "email", "password", "password2","weight", "height", "age"]
        
    def validate_username(self, value):
        value = value.lower()
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value
        
    def validate_email(self, value):
        value = value.lower()
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value
    
    def validate(self,data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        validate_password(data['password'])
        return data
        
        

    def create(self, validated_data):
        validated_data.pop("password2")
        user = CustomUser.objects.create(
            username=validated_data['username'].lower(),
            email=validated_data['email'].lower(),
            height=validated_data.get('height'),
            weight=validated_data.get('weight'),
            age=validated_data.get('age')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, data):
        if not data['username']:
            raise serializers.ValidationError("Username is required.")
        if not data['password']:
            raise serializers.ValidationError("Password is required.")
        return data

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'name',]
        read_only_fields = ['user'] 

class FitnessGoalSerializer(serializers.ModelSerializer):
    activity_name =  serializers.CharField(source='activity.name', read_only=True)
    activity_id = serializers.PrimaryKeyRelatedField(source='activity', queryset=Activity.objects.all(), write_only=True, required=False, allow_null=True)
    class Meta:
        model = FitnessGoal
        fields = ['id', 'activity_name','activity_id', 'description', 'target_value', 'unit', 'deadline', 'created_at']
        read_only_fields = ['user','created_at']
