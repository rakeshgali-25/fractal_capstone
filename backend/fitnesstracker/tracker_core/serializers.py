# tracker_core/serializers.py
from datetime import datetime
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from rest_framework import serializers

from .models import Activity, FitnessGoal, ActivityLog

User = get_user_model()

# METs for estimation
ACTIVITY_MET = {
    "walking": 3.5,
    "running": 9.8,
    "cycling": 7.5,
    "yoga": 3.0,
    "swimming": 6.0,
    "gym workout": 6.0,
    "default": 4.0,
}

DEFAULT_STRIDE_M = 0.78


def steps_to_km(steps: int, stride_m: float = DEFAULT_STRIDE_M) -> float:
    try:
        return round((int(steps) * float(stride_m)) / 1000.0, 3)
    except Exception:
        return 0.0


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
            "current_value",
            "progress_percent",
        ]
        read_only_fields = ["created_at", "current_value", "progress_percent"]

    def validate_target_value(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("target_value must be greater than 0.")
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    # activity info is derived via the linked goal (goal -> activity)
    goal_title = serializers.CharField(source="goal.title", read_only=True)
    activity_name = serializers.SerializerMethodField()
    activity_id = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "goal",
            "goal_title",
            "activity_id",
            "activity_name",
            "duration_minutes",
            "distance_km",
            "steps",
            "calories",
            "count",
            "timestamp",
        ]
        read_only_fields = ["id", "goal_title", "activity_name", "activity_id", "timestamp"]

    def get_activity_name(self, obj):
        try:
            return obj.goal.activity.name if obj.goal and obj.goal.activity else None
        except Exception:
            return None

    def get_activity_id(self, obj):
        try:
            return obj.goal.activity.id if obj.goal and obj.goal.activity else None
        except Exception:
            return None


class ActivityLogCreateSerializer(serializers.Serializer):
    """
    Robust create serializer:
    Accepts either:
      - activity_id (preferred) OR goal (existing goal id)
      - duration or duration_minutes (both accepted)
      - distance_km, steps, count, calories, date (optional)
    It will:
      - resolve activity from activity_id or goal
      - normalize duration -> duration_minutes
      - compute distance from steps if needed
      - estimate calories if not provided (using duration_minutes)
    """
    activity_id = serializers.IntegerField(required=False)
    goal = serializers.IntegerField(required=False)
    # accept either name
    duration = serializers.IntegerField(required=False, min_value=1)
    duration_minutes = serializers.IntegerField(required=False, min_value=1)
    distance_km = serializers.FloatField(required=False)
    steps = serializers.IntegerField(required=False)
    count = serializers.IntegerField(required=False)
    calories = serializers.FloatField(required=False)
    date = serializers.DateField(required=False)

    def validate(self, data):
        # require at least activity_id or goal
        if not data.get('activity_id') and not data.get('goal'):
            raise serializers.ValidationError("Provide activity_id or goal id.")
        # normalize duration presence
        if not data.get('duration') and not data.get('duration_minutes') and not data.get('distance_km') and not data.get('steps') and not data.get('calories'):
            raise serializers.ValidationError("Provide at least one metric: duration/distance/steps/calories.")
        return data

    def _get_activity(self, user, validated_data):
        # prefer activity_id
        act = None
        if validated_data.get('activity_id'):
            act = Activity.objects.filter(id=validated_data['activity_id']).first()
        if not act and validated_data.get('goal'):
            g = FitnessGoal.objects.filter(id=validated_data['goal'], user=user).first()
            act = g.activity if g else None
        return act

    def _estimate_calories(self, user, activity_name: str, duration_minutes=None, distance_km=None, steps=None) -> float:
        """
        Estimate calories using best available metric:
        - Prefer duration
        - Else use distance (for walking/running)
        - Else use steps (converted to km)
        """
        met = ACTIVITY_MET.get(activity_name.lower(), ACTIVITY_MET["default"])
        weight = getattr(user, "weight", None) or 70.0

        # Duration-based
        if duration_minutes:
            hours = duration_minutes / 60.0
            return round(float(met * weight * hours), 1)

        # Distance-based (rough: assume avg speed ~ 5 km/h for walking, 8 km/h for running)
        if distance_km:
            avg_speed_kmh = 5 if "walk" in activity_name.lower() else 8
            hours = distance_km / avg_speed_kmh
            return round(float(met * weight * hours), 1)

        # Steps-based → convert to km
        if steps:
            distance_km = steps_to_km(steps)
            avg_speed_kmh = 5
            hours = distance_km / avg_speed_kmh
            return round(float(met * weight * hours), 1)

        return 0.0


    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None:
            raise serializers.ValidationError("Authentication required.")

        # Resolve activity
        activity = self._get_activity(user, validated_data)
        if not activity:
            raise serializers.ValidationError("Activity not found. Provide valid activity_id or goal.")

        # Normalize duration
        duration = validated_data.get('duration') or validated_data.get('duration_minutes')
        distance_km = validated_data.get('distance_km')
        steps = validated_data.get('steps')
        count = validated_data.get('count')
        provided_calories = validated_data.get('calories')
        date_val = validated_data.get('date')

        # timestamp
        if date_val:
            ts = timezone.make_aware(datetime.combine(date_val, datetime.min.time()))
        else:
            ts = timezone.now()

        # derive missing fields
        if steps and not distance_km:
            distance_km = steps_to_km(steps)

        # If calories missing, prefer to estimate from duration -> duration_minutes
        calories = provided_calories
        if calories in (None, ""):
            calories = self._estimate_calories(
                user,
                activity.name,
                duration_minutes=duration,
                distance_km=distance_km,
                steps=steps,
            )

        # attach or create a goal for the user+activity if goal not provided
        goal_obj = None
        if validated_data.get('goal'):
            goal_obj = FitnessGoal.objects.filter(id=validated_data['goal'], user=user).first()
        if not goal_obj:
            goal_obj = FitnessGoal.objects.filter(user=user, activity=activity).first()
        if not goal_obj:
            goal_obj = FitnessGoal.objects.create(
                user=user,
                title=f"{activity.name} (auto)",
                activity=activity,
                description="Auto-created placeholder goal",
                target_value=0.0,
                unit="kcal",
            )

        # save the log
        with transaction.atomic():
            log = ActivityLog.objects.create(
                user=user,
                goal=goal_obj,
                duration_minutes=duration,
                distance_km=distance_km,
                steps=steps,
                count=count,
                calories=calories,
                timestamp=ts,
            )

            # recalc all goals for this user+activity (daily/weekly/monthly)
            goals = FitnessGoal.objects.filter(user=user, activity=activity)
            log_date = ts.date()
            for g in goals:
                try:
                    g.recalculate_progress(as_of_date=log_date)
                except Exception:
                    pass

        return log


class ProgressGoalSerializer(serializers.ModelSerializer):
    activity_name = serializers.CharField(source="activity.name", read_only=True)

    class Meta:
        model = FitnessGoal
        fields = [
            "id",
            "title",
            "activity",
            "activity_name",
            "unit",
            "target_value",
            "frequency",
            "deadline",
            "current_value",
            "progress_percent",
        ]
        read_only_fields = ["id", "activity_name", "current_value", "progress_percent"]
