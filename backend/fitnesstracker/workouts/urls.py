from django.urls import path
from .views import *



urlpatterns = [
    path('',home.as_view(),),
    path('register/',RegisterApi.as_view()),
    path('login/',LoginApi.as_view()),
    path('fitness-goal/',FitnessGoalApi.as_view()),
    path('add-activity/',ActivityApi.as_view()),
    path('activityLog/',ActivityLogApi.as_view()),
    path('profile/', ProfileView.as_view(), name='profile'),    

]
