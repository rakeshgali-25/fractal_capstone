# tracker_core/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Activity, FitnessGoal, ActivityLog
from .serializers import (
    ActivitySerializer,
    FitnessGoalSerializer,
    ActivityLogSerializer,
    ActivityLogCreateSerializer,
)


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List predefined activities (seed these via admin/migration).
    """
    permission_classes = [IsAuthenticated]
    queryset = Activity.objects.all().order_by("name")
    serializer_class = ActivitySerializer


class FitnessGoalViewSet(viewsets.ModelViewSet):
    """
    CRUD for the user's goals.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FitnessGoalSerializer

    def get_queryset(self):
        return FitnessGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ActivityLogViewSet(viewsets.ModelViewSet):
    """
    List/create/update/delete activity logs.
    Create expects: { activity_id, duration, date (optional) } and returns created log.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by("-timestamp")

    def get_serializer_class(self):
        if self.action == "create":
            return ActivityLogCreateSerializer
        return ActivityLogSerializer

    def create(self, request, *args, **kwargs):
        serializer = ActivityLogCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        log = serializer.save()
        out = ActivityLogSerializer(log, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
