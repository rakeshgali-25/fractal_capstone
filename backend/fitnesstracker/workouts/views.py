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
    permission_classes = [IsAuthenticated] #this is for test pu
    def get(self,request):
        return Response({'status':200,'message':"Working"})
        


class RegisterApi(APIView):
    def post(self,request):
        try:
            data = request.data
            serializer = RegisterSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'message':"User Registered Successfully"},status=status.HTTP_201_CREATED)
            else:    
                return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        

class LoginApi(APIView):
    def post(self,request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            identifier = serializer.validated_data['identifier'].lower()
            password = serializer.validated_data['password']

            # Try to find user by email or username
            user = CustomUser.objects.filter(email__iexact=identifier).first()
            if not user:
                user = CustomUser.objects.filter(username__iexact=identifier).first()

            if not user:
                return Response({'message': "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            # Authenticate using username
            user = authenticate(username=user.username, password=password)
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

# class LoginApi(APIView):
#     def post(self,request):
#         try:
#             data = request.data
#         except:
#             return Response({'message':"Invalid or missing parameters"},status=status.HTTP_400_BAD_REQUEST)
        
#         if not data:
#             return Response({'message':"No data provided"},status=status.HTTP_400_BAD_REQUEST)
#         serializer = LoginSerializer(data=data)
#         if serializer.is_valid():
#             user = authenticate(username=serializer.validated_data['username'].lower(),password=serializer.validated_data['password'])
#             if user:
#                 refresh = RefreshToken.for_user(user)

#                 return Response({
#                     'status':status.HTTP_200_OK,
#                     'refresh': str(refresh),
#                     'access': str(refresh.access_token),
#                     'message':"Login Successful"
#                     })
#             else:
#                 return Response({'message':"Invalid Credentials"},status=status.HTTP_401_UNAUTHORIZED)
#         else:
#             return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)



class ActivityApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            activity = Activity.objects.filter(user=request.user)
            serializer = ActivitySerializer(activity,many=True)
            return Response({'status':200,'data':serializer.data})
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self,request):
        try:
            data = request.data
            serializer = ActivitySerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response({'status':201,'message':"Activity Created Successfully"},status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self,request):
        data = request.data
        try:
            activity = Activity.objects.filter(id=data.get('id'),user=request.user).first()
            if not activity:
                return Response({'message':"Activity not found"},status=status.HTTP_404_NOT_FOUND)
            activity.delete()
            return Response({'status':200,'message':"Activity Deleted Successfully"})
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class FitnessGoalApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            goals = FitnessGoal.objects.filter(user=request.user)
            serializer = FitnessGoalSerializer(goals,many=True)
            return Response({'status':200,'data':serializer.data})
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self,request):
        try:
            data = request.data
            serializer = FitnessGoalSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response({'status':201,'message':"Fitness Goal Created Successfully"},status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    def put(self,request):
        data = request.data
        id = data.get('id')
        try:
            goal = FitnessGoal.objects.filter(id=id,user=request.user).first()
            serializer = FitnessGoalSerializer(goal,data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'status':200,'message':"Fitness Goal Updated Successfully"})
            else:
                return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except FitnessGoal.DoesNotExist:
            return Response({'message':"Fitness Goal not found"},status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self,request):
        data = request.data
        try:
            goal = FitnessGoal.objects.filter(id=data.get('id'),user=request.user).first()
            if not goal:
                return Response({'message':"Fitness Goal not found"},status=status.HTTP_404_NOT_FOUND)
            goal.delete()
            return Response({'status':200,'message':"Fitness Goal Deleted Successfully"})
        except Exception as e:
            return Response({'message':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


class ActivityLogApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logs = ActivityLog.objects.filter(user=request.user).order_by('-timestamp')
            serializer = ActivityLogSerializer(logs, many=True)
            return Response({'status': 200, 'data': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            serializer = ActivityLogSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response({'status': 201, 'message': "Activity log created successfully"}, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        data = request.data
        log_id = data.get('id')
        try:
            log = ActivityLog.objects.filter(id=log_id, user=request.user).first()
            if not log:
                return Response({'message': "Activity log not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = ActivityLogSerializer(log, data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({'status': 200, 'message': "Activity log updated successfully"}, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        log_id = request.data.get('id')
        try:
            log = ActivityLog.objects.filter(id=log_id, user=request.user).first()
            if not log:
                return Response({'message': "Activity log not found"}, status=status.HTTP_404_NOT_FOUND)

            log.delete()
            return Response({'status': 200, 'message': "Activity log deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):

    # permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return logged-in user's profile info"""
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):  
        serializer = ProfileSerializer(request.user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request): 
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)