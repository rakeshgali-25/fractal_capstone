from django.db import models
from django.contrib.auth.models import User

class FitnessGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fitness_goals')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    target_value = models.FloatField()
    unit = models.CharField(max_length=20)  # e.g., kg, km, minutes
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    goal = models.ForeignKey(FitnessGoal, on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=100)
    value = models.FloatField()
    unit = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.activity_type} - {self.value} {self.unit} ({self.user.username})"

class Progress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_records')
    goal = models.ForeignKey(FitnessGoal, on_delete=models.CASCADE, related_name='progress_records')
    current_value = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.goal.title} Progress"
