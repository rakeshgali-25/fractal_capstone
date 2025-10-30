from django.shortcuts import render 
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import *
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated 


# Create your views here.

class home(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        return Response({'status':200,'message':"Working"})
        


class RegisterApi(APIView):
    def post(self,request):
        data = request.data
        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':"User Registered Successfully"},status=status.HTTP_201_CREATED)
        else:    
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        
        

class LoginApi(APIView):
    def post(self,request):
        data = request.data
        serializer = LoginSerializer(data=data)
        if serializer.is_valid():
            user = authenticate(username=serializer.validated_data['username'],password=serializer.validated_data['password'])
            if user:
                refresh = RefreshToken.for_user(user)

                return Response({
                    'status':status.HTTP_200_OK,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'message':"Login Successful"
                    })
            else:
                return Response({'message':"Invalid Credentials"},status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)




