from django.urls import path
from .views import *



urlpatterns = [
    path('',home.as_view(),),
    path('register/',RegisterApi.as_view()),
    path('login/',LoginApi.as_view()),

]
