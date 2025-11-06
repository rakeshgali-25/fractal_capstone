from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)


class Activity(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activities')
    name = models.CharField(max_length=100)  # e.g., Running, Swimming
    
    class Meta:
        unique_together = ('user', 'name')
    def validate_name(self, value):
        # Capitalize the first letter of the name
        return value.capitalize()
    
    def __str__(self):
        return self.name


class FitnessGoal(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='fitness_goals')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='goals')
    description = models.TextField(blank=True)
    target_value = models.FloatField()
    unit = models.CharField(max_length=20)  # e.g., km, minutes
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.activity.name if self.activity else 'No Activity'})"

    
    
class ActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    goal = models.ForeignKey(FitnessGoal, on_delete=models.CASCADE, related_name='activity_logs')
    current_value = models.FloatField()
    unit = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.goal.activity.name} - {self.current_value} {self.unit} by {self.user.username}"
    
    
class Progress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='progress_records')
    goal = models.ForeignKey(FitnessGoal, on_delete=models.CASCADE, related_name='progress_records')
    value = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.goal.activity.name if self.goal.activity else 'No Activity'} Progress"
