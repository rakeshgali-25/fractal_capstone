# tracker_core/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ActivityViewSet, FitnessGoalViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r"activities", ActivityViewSet, basename="tracker-activities")
router.register(r"goals", FitnessGoalViewSet, basename="tracker-goals")
router.register(r"activity-logs", ActivityLogViewSet, basename="tracker-activity-logs")

urlpatterns = [
    path("", include(router.urls)),
]
