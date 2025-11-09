# tracker_core/models.py
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Activity(models.Model):
    """Predefined activities (seed via admin or migration)."""
    name = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.name


class FitnessGoal(models.Model):
    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("one_time", "One-time"),
    ]

    # use a unique related_name to avoid clashes with other apps
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tracker_fitness_goals")
    title = models.CharField(max_length=140)
    activity = models.ForeignKey(Activity, on_delete=models.SET_NULL, null=True, blank=True, related_name="tracker_goals")
    description = models.TextField(blank=True)
    target_value = models.FloatField()  # numeric target
    unit = models.CharField(max_length=30)  # 'kcal', 'km', 'sessions'
    frequency = models.CharField(max_length=12, choices=FREQUENCY_CHOICES, default="weekly")
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.title}"


class ActivityLog(models.Model):
    # user-specific logs for goals/activities
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tracker_activity_logs")
    goal = models.ForeignKey(FitnessGoal, on_delete=models.CASCADE, related_name="tracker_activity_logs")
    current_value = models.FloatField()   # e.g., calories estimated
    unit = models.CharField(max_length=20)  # usually 'kcal'
    duration_min = models.PositiveIntegerField(null=True, blank=True)  # optional: minutes logged
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user} - {self.goal.title} - {self.current_value} {self.unit}"
