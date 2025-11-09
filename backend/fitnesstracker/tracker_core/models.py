from datetime import date, timedelta
from django.db import models
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone

User = settings.AUTH_USER_MODEL


# mapping units to ActivityLog fields
UNIT_FIELD = {
    "min": "duration_minutes",
    "minutes": "duration_minutes",
    "km": "distance_km",
    "distance": "distance_km",
    "steps": "steps",
    "kcal": "calories",
    "calories": "calories",
    "sessions": "count",
    "count": "count",
}


def get_period_range(target_date: date, freq: str):
    """Return (start_date, end_date) for a given frequency (daily/weekly/monthly)."""
    if freq == "daily":
        return target_date, target_date
    elif freq == "weekly":
        start = target_date - timedelta(days=target_date.weekday())  # Monday
        end = start + timedelta(days=6)
        return start, end
    elif freq == "monthly":
        start = target_date.replace(day=1)
        if target_date.month == 12:
            end = target_date.replace(day=31)
        else:
            next_month = target_date.replace(month=target_date.month + 1, day=1)
            end = next_month - timedelta(days=1)
        return start, end
    return date(1970, 1, 1), target_date


class Activity(models.Model):
    """Predefined activities (seed via admin or migration)."""
    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FitnessGoal(models.Model):
    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("one_time", "One-time"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tracker_fitness_goals")
    title = models.CharField(max_length=140)
    activity = models.ForeignKey(
        Activity, on_delete=models.SET_NULL, null=True, blank=True, related_name="tracker_goals"
    )
    description = models.TextField(blank=True)
    target_value = models.FloatField()
    unit = models.CharField(max_length=30)
    frequency = models.CharField(max_length=12, choices=FREQUENCY_CHOICES, default="weekly")
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # new tracking fields
    current_value = models.FloatField(default=0.0)
    progress_percent = models.FloatField(default=0.0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.title}"

    def recalculate_progress(self, as_of_date=None):
        """Recalculate goal progress for its frequency period."""
        from .models import ActivityLog  # avoid circular import

        if as_of_date is None:
            as_of_date = timezone.localdate()

        start, end = get_period_range(as_of_date, self.frequency)
        field_name = UNIT_FIELD.get((self.unit or "").lower(), "calories")

        total = (
            ActivityLog.objects.filter(
                user=self.user,
                goal=self,
                timestamp__date__gte=start,
                timestamp__date__lte=end,
            ).aggregate(total=Sum(field_name))["total"]
            or 0.0
        )

        self.current_value = round(float(total), 2)
        self.progress_percent = (
            min(100.0, round((self.current_value / self.target_value) * 100.0, 2))
            if self.target_value > 0
            else 0.0
        )
        self.save(update_fields=["current_value", "progress_percent"])
        return self.current_value, self.progress_percent


class ActivityLog(models.Model):
    """User's logged activity data, supports flexible metrics."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tracker_activity_logs")
    goal = models.ForeignKey(
        FitnessGoal, on_delete=models.CASCADE, related_name="tracker_activity_logs", null=True, blank=True
    )

    # metrics
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    distance_km = models.FloatField(null=True, blank=True)
    steps = models.IntegerField(null=True, blank=True)
    calories = models.FloatField(null=True, blank=True)
    count = models.IntegerField(null=True, blank=True)

    # when activity happened
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        parts = []
        if self.duration_minutes:
            parts.append(f"{self.duration_minutes} min")
        if self.distance_km:
            parts.append(f"{self.distance_km} km")
        if self.calories:
            parts.append(f"{self.calories} kcal")
        return f"{self.user} - {self.goal or self.activity_name()} - {'/'.join(parts)}"

    def activity_name(self):
        return self.goal.activity.name if self.goal and self.goal.activity else "Activity"
