# tracker_core/management/commands/seed_activities.py
from django.core.management.base import BaseCommand
from tracker_core.models import Activity

class Command(BaseCommand):
    help = 'Seed the database with default activities'

    def handle(self, *args, **options):
        activities = ["Running", "Walking", "Cycling", "Yoga", "Swimming", "Gym Workout"]
        
        for activity_name in activities:
            activity, created = Activity.objects.get_or_create(name=activity_name)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created activity: {activity_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Activity already exists: {activity_name}')
                )