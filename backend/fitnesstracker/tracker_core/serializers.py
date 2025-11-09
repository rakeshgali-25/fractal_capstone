# tracker_core/serializers.py
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from django.db import transaction

from .models import Activity, FitnessGoal, ActivityLog

User = get_user_model()

# small MET table for calorie estimation
ACTIVITY_MET = {
    "walking": 3.5,
    "running": 9.8,
    "cycling": 7.5,
    "yoga": 3.0,
    "swimming": 6.0,
    "gym workout": 6.0,
    "default": 4.0,
}


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ["id", "name"]


class FitnessGoalSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="activity.name", read_only=True)

    class Meta:
        model = FitnessGoal
        fields = [
            "id",
            "title",
            "activity",
            "activity_name",
            "description",
            "target_value",
            "unit",
            "frequency",
            "deadline",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_target_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("target_value must be greater than 0.")
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    goal_title = serializers.CharField(source="goal.title", read_only=True)
    activity_name = serializers.CharField(source="goal.activity.name", read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "goal",
            "goal_title",
            "activity_name",
            "current_value",
            "unit",
            "duration_min",
            "timestamp",
        ]
        read_only_fields = ["id", "goal_title", "activity_name", "current_value", "unit", "timestamp"]


class ActivityLogCreateSerializer(serializers.Serializer):
    # client sends activity_id (predefined activity), duration (minutes), optional date
    activity_id = serializers.IntegerField(required=True)
    duration = serializers.IntegerField(required=True, min_value=1)
    date = serializers.DateField(required=False)

    def validate_activity_id(self, value):
        if not Activity.objects.filter(id=value).exists():
            raise serializers.ValidationError("Activity not found.")
        return value

    def _estimate_calories(self, user: User, activity_name: str, duration_minutes: int) -> float:
        met = ACTIVITY_MET.get(activity_name.lower(), ACTIVITY_MET["default"])
        weight = getattr(user, "weight", None) or 70.0
        hours = duration_minutes / 60.0
        calories = met * weight * hours
        return round(calories, 1)

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user

        activity_id = validated_data["activity_id"]
        duration = validated_data["duration"]
        date = validated_data.get("date")

        activity = Activity.objects.get(id=activity_id)

        # find existing goal for the user+activity, else create a minimal placeholder goal
        goal = FitnessGoal.objects.filter(user=user, activity=activity).first()
        if not goal:
            goal = FitnessGoal.objects.create(
                user=user,
                title=f"{activity.name} (auto)",
                activity=activity,
                description="Auto-created placeholder goal",
                target_value=0.0,
                unit="kcal",
            )

        calories = self._estimate_calories(user, activity.name, duration)

        with transaction.atomic():
            # choose timestamp: provided date (midnight) or now
            if date:
                dt = timezone.datetime.combine(date, timezone.datetime.min.time())
                ts = timezone.make_aware(dt)
            else:
                ts = timezone.now()

            log = ActivityLog.objects.create(
                user=user,
                goal=goal,
                current_value=calories,
                unit="kcal",
                duration_min=duration,
                timestamp=ts,
            )

        return log
