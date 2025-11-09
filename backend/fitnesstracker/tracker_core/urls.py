# tracker_core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityViewSet,
    FitnessGoalViewSet,
    ActivityLogViewSet,
    ProgressViewSet,
    DashboardAPIView
)

router = DefaultRouter()
router.register(r"activities", ActivityViewSet, basename="tracker-activities")
router.register(r"goals", FitnessGoalViewSet, basename="tracker-goals")
router.register(r"activity-logs", ActivityLogViewSet, basename="tracker-activity-logs")
router.register(r"progress", ProgressViewSet, basename="tracker-progress")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard-api"),
]
