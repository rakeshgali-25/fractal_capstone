# tracker_core/views.py
from datetime import datetime,timedelta
from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination


from rest_framework.decorators import action
from rest_framework.views import APIView

from .models import Activity, FitnessGoal, ActivityLog, UNIT_FIELD
from .serializers import (
    ActivitySerializer,
    FitnessGoalSerializer,
    ActivityLogSerializer,
    ActivityLogCreateSerializer,
    ProgressGoalSerializer,
)


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List predefined activities.
    """
    permission_classes = [IsAuthenticated]
    queryset = Activity.objects.all().order_by("name")
    serializer_class = ActivitySerializer


class FitnessGoalViewSet(viewsets.ModelViewSet):
    """
    CRUD for user's goals. On create/update we recalc the goal so stored fields are fresh.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FitnessGoalSerializer

    def get_queryset(self):
        return FitnessGoal.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        goal = serializer.save(user=self.request.user)
        try:
            goal.recalculate_progress()
        except Exception:
            pass
        return goal

    def perform_update(self, serializer):
        goal = serializer.save()
        try:
            goal.recalculate_progress()
        except Exception:
            pass
        return goal

class SmallPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50

class ActivityLogViewSet(viewsets.ModelViewSet):
    """
    CRUD for activity logs. Create uses ActivityLogCreateSerializer (which already recalculates goals).
    Update and destroy also recalc affected goals.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ActivityLogSerializer
    # pagination_class = SmallPagination

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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = ActivityLogSerializer(instance, data=request.data, partial=partial, context={"request": request})
        serializer.is_valid(raise_exception=True)
        log = serializer.save()

        # recalc goals for this user+activity using log date
        try:
            log_date = log.timestamp.date() if hasattr(log, "timestamp") else timezone.localdate()
            goals = FitnessGoal.objects.filter(user=request.user, activity=log.goal.activity if log.goal else None)
            for g in goals:
                g.recalculate_progress(as_of_date=log_date)
        except Exception:
            pass

        return Response(ActivityLogSerializer(log).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # capture goal & date before delete
        goal = getattr(instance, "goal", None)
        log_date = instance.timestamp.date() if getattr(instance, "timestamp", None) else timezone.localdate()
        activity = goal.activity if goal else None

        self.perform_destroy(instance)

        # recalc goals for this user+activity (if any)
        try:
            goals = FitnessGoal.objects.filter(user=request.user, activity=activity)
            for g in goals:
                g.recalculate_progress(as_of_date=log_date)
        except Exception:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProgressViewSet(viewsets.ViewSet):
    """
    Read-only viewset to return progress for the user's goals.
    Aggregates the appropriate ActivityLog field depending on the goal.unit.
    Registered with router as 'progress' (GET /api/progress/).
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        goals = FitnessGoal.objects.filter(user=user).order_by("-created_at")
        serializer = ProgressGoalSerializer(goals, many=True)

        now = timezone.now()
        today_start = timezone.make_aware(datetime.combine(now.date(), datetime.min.time()))

        result = []
        for goal_obj, goal_data in zip(goals, serializer.data):
            freq = (goal_obj.frequency or "weekly").lower()
            if freq == "daily":
                since = today_start
            elif freq == "weekly":
                since = now - timezone.timedelta(days=7)
            elif freq == "monthly":
                since = now - timezone.timedelta(days=30)
            else:
                since = None

            # Aggregate logs that belong to this specific goal
            logs_qs = ActivityLog.objects.filter(goal=goal_obj, user=user).order_by("-timestamp")
            if since:
                logs_qs = logs_qs.filter(timestamp__gte=since)

            # Decide which field to sum based on goal.unit
            unit_key = (goal_obj.unit or "").lower()
            field_name = UNIT_FIELD.get(unit_key)

            current_sum = 0.0
            if field_name:
                agg = logs_qs.aggregate(total=Sum(field_name))
                current_sum = agg.get("total") or 0.0
            else:
                # fallback to stored goal.current_value if mapping missing
                current_sum = getattr(goal_obj, "current_value", 0.0)

            target = goal_obj.target_value or 0.0
            percent = 0.0
            if target and target > 0:
                percent = min(100.0, (float(current_sum) / float(target)) * 100.0)

            result.append(
                {
                    **goal_data,
                    "current_value": round(float(current_sum), 2),
                    "progress_percent": round(percent, 1),
                }
            )

        return Response(result, status=status.HTTP_200_OK)







class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timedelta(days=6)

        # --- Logs for last 7 days ---
        logs_qs = ActivityLog.objects.filter(user=user, timestamp__date__gte=week_start)
        today_logs = logs_qs.filter(timestamp__date=today)

        # --- Safe aggregation helper ---
        def safe_sum(qs, field):
            val = qs.aggregate(total=Sum(field)).get("total")
            try:
                return float(val or 0.0)
            except (TypeError, ValueError):
                return 0.0

        # --- Summary section ---
        calories_today = safe_sum(today_logs, "calories")
        active_minutes_today = safe_sum(today_logs, "duration_minutes")
        steps_today = safe_sum(today_logs, "steps")

        goals = FitnessGoal.objects.filter(user=user)
        summary = {
            "calories_today": round(calories_today, 1),
            "active_minutes_today": int(active_minutes_today),
            "steps_today": int(steps_today),
            "completed_goals": goals.filter(target_value__gt=0).count(),  # placeholder
            "total_goals": goals.count(),
        }

        # --- Weekly activity chart data ---
        weekly_data = []
        activities = logs_qs.values_list("goal__activity__name", flat=True).distinct()
        for activity_name in activities:
            if not activity_name:
                continue
            daily_values = []
            for i in range(7):
                date = week_start + timedelta(days=i)
                total = safe_sum(
                    logs_qs.filter(goal__activity__name=activity_name, timestamp__date=date),
                    "calories",
                )
                daily_values.append(round(total, 1))
            if any(v > 0 for v in daily_values):
                weekly_data.append({"activity": activity_name, "data": daily_values})

        # --- Activity share (donut chart) ---
        share_qs = logs_qs.values("goal__activity__name").annotate(total=Sum("calories")).order_by("-total")
        activity_share = []
        for s in share_qs:
            name = s.get("goal__activity__name") or "Other"
            total_val = s.get("total") or 0.0
            try:
                total_val = float(total_val)
            except (TypeError, ValueError):
                total_val = 0.0
            activity_share.append({
                "activity": name,
                "calories": round(total_val, 1),
            })

        # --- Recent activity logs (latest 5) ---
        recent_qs = ActivityLog.objects.filter(user=user).order_by("-timestamp")[:5]
        recent_activity = []
        for r in recent_qs:
            activity_name = None
            try:
                activity_name = r.goal.activity.name if r.goal and r.goal.activity else None
            except Exception:
                activity_name = None
            recent_activity.append({
                "activity": activity_name or "Unknown",
                "date": r.timestamp.date().isoformat() if r.timestamp else None,
                "calories": round(float(r.calories or 0.0), 1),
            })

        return Response({
            "summary": summary,
            "weekly_activity_stats": weekly_data,
            "activity_share": activity_share,
            "recent_activity": recent_activity,
        }, status=200)


