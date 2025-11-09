# tracker_core/management/commands/seed_mock_data.py
import random
from datetime import timedelta, datetime

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from tracker_core.models import Activity, FitnessGoal, ActivityLog

User = get_user_model()


DEFAULT_ACTIVITIES = [
    "Walking", "Running", "Cycling", "Yoga", "Swimming", "Gym Workout", "Other"
]

DEMO_GOALS = [
    # title, activity_name, target_value, unit, frequency
    ("10,000 steps daily", "Walking", 10000, "steps", "daily"),
    ("Burn 3500 kcal weekly", "Running", 3500, "kcal", "weekly"),
    ("Run 20 km / week", "Running", 20, "km", "weekly"),
    ("Do yoga 3x week", "Yoga", 3, "sessions", "weekly"),
    ("Gym Workout daily", "Gym Workout", 60, "min", "daily"),
]


def _has_field(model, field_name):
    return field_name in {f.name for f in model._meta.get_fields()}


class Command(BaseCommand):
    help = "Seed demo user, activities, goals and activity logs (safe / idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--user", default="demo", help="username for demo user")
        parser.add_argument("--password", default="demo123", help="password for demo user")
        parser.add_argument("--days", type=int, default=14, help="how many days of logs to create")

    def handle(self, *args, **options):
        username = options["user"]
        password = options["password"]
        days = options["days"]

        # create/demo user
        user, created = User.objects.get_or_create(username=username, defaults={"is_active": True})
        if created:
            user.set_password(password)
            # if your custom user has email/first_name fields you can set them as well
            try:
                user.email = "demo@example.com"
            except Exception:
                pass
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created demo user '{username}' (password: {password})"))
        else:
            self.stdout.write(self.style.NOTICE(f"Demo user '{username}' already exists."))

        # ensure activities
        activities_map = {}
        for name in DEFAULT_ACTIVITIES:
            act, _ = Activity.objects.get_or_create(name=name)
            activities_map[name] = act
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(DEFAULT_ACTIVITIES)} activities"))

        # ensure demo goals for demo user
        created_goals = []
        for title, activity_name, target, unit, freq in DEMO_GOALS:
            activity = activities_map.get(activity_name)
            g, created = FitnessGoal.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    "activity": activity,
                    "description": f"Demo goal: {title}",
                    "target_value": float(target),
                    "unit": unit,
                    "frequency": freq,
                },
            )
            if not created:
                # update target/unit/frequency to be sure
                changed = False
                if g.target_value != float(target):
                    g.target_value = float(target)
                    changed = True
                if g.unit != unit:
                    g.unit = unit
                    changed = True
                if g.frequency != freq:
                    g.frequency = freq
                    changed = True
                if g.activity != activity:
                    g.activity = activity
                    changed = True
                if changed:
                    g.save()
            created_goals.append(g)
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(created_goals)} demo goals"))

        # seed activity logs for last `days`
        start_date = timezone.localdate() - timedelta(days=days - 1)
        logs_created = 0

        # model field presence checks (be defensive)
        has_steps = _has_field(ActivityLog, "steps")
        has_distance = _has_field(ActivityLog, "distance_km")
        has_duration = _has_field(ActivityLog, "duration_minutes")
        has_calories = _has_field(ActivityLog, "calories")
        has_unit = _has_field(ActivityLog, "unit")

        random.seed(42)  # deterministic-ish seeds for reproducible demo

        with transaction.atomic():
            for day_offset in range(days):
                day = start_date + timedelta(days=day_offset)
                # more activity on weekends (Saturday, Sunday)
                weekday = day.weekday()  # 0 Mon .. 6 Sun
                weekend = weekday in (5, 6)
                # number of logs per day: 1-4 on weekdays, 2-6 on weekends
                num_logs = random.randint(1, 3) + (2 if weekend else 0)

                for _ in range(num_logs):
                    # pick an activity weighted toward Walking / Gym / Running
                    activity_choice = random.choices(
                        population=list(activities_map.keys()),
                        weights=[20, 18, 10, 6, 4, 18, 4],  # weights to favour walking/running/gym
                        k=1,
                    )[0]
                    activity = activities_map[activity_choice]

                    # find an existing goal for this activity for demo user, else pick random demo goal
                    goal = FitnessGoal.objects.filter(user=user, activity=activity).first()
                    if not goal:
                        goal = random.choice(created_goals)

                    # generate plausible measures
                    # durations: walking 10-90, running 10-60, cycling 10-90, gym 20-120, yoga 20-60
                    duration = None
                    steps = None
                    distance_km = None
                    calories = None
                    count = None

                    if activity_choice == "Walking":
                        steps = random.randint(500, 12000 if weekend else 6000)
                        # duration rough: steps / 100 per minute
                        duration = max(5, int(steps / 100))
                        distance_km = round(steps / 1300.0, 2)  # 1300 steps ~ 1km
                    elif activity_choice == "Running":
                        duration = random.randint(10, 60 if not weekend else 80)
                        distance_km = round(random.uniform(2.0, 12.0), 2)
                        # approximate calories: 10 kcal/min
                        calories = round(10.0 * duration, 1)
                    elif activity_choice == "Cycling":
                        duration = random.randint(10, 90 if weekend else 40)
                        distance_km = round(random.uniform(2.0, 30.0), 2)
                        calories = round(8.0 * duration, 1)
                    elif activity_choice == "Yoga":
                        duration = random.randint(20, 60)
                        calories = round(3.0 * duration, 1)
                        count = random.randint(1, 3)
                    elif activity_choice == "Gym Workout":
                        duration = random.randint(20, 120)
                        calories = round(6.0 * duration, 1)
                    elif activity_choice == "Swimming":
                        duration = random.randint(15, 60)
                        calories = round(6.0 * duration, 1)
                    else:
                        # Other
                        duration = random.randint(5, 40)
                        calories = round(4.0 * duration, 1)

                    # increase magnitude for weekends
                    if weekend:
                        if duration:
                            duration = int(duration * (1.2 + random.random() * 0.5))
                        if steps:
                            steps = int(steps * (1.3 + random.random() * 0.6))
                        if calories:
                            calories = round(calories * (1.2 + random.random() * 0.5), 1)

                    # timestamp: random time during the day
                    hour = random.randint(6, 20)
                    minute = random.randint(0, 59)
                    ts = timezone.make_aware(datetime.combine(day, datetime.min.time())) + timedelta(hours=hour, minutes=minute)

                    # build kwargs only for fields present on ActivityLog
                    log_kwargs = {"user": user, "goal": goal, "timestamp": ts}
                    if has_duration:
                        log_kwargs["duration_minutes"] = duration if duration is not None else None
                    if has_steps and steps is not None:
                        log_kwargs["steps"] = steps
                    if has_distance:
                        log_kwargs["distance_km"] = distance_km
                    if has_calories:
                        # if calories not computed above, estimate using default rates
                        if calories is None:
                            if steps:
                                calories = round(0.05 * steps, 1)
                            elif duration:
                                calories = round(4.0 * duration, 1)
                            else:
                                calories = round(random.uniform(20, 300), 1)
                        log_kwargs["calories"] = calories
                    if has_unit:
                        # unit: prefer kcal if calories present else min/km/steps
                        if has_calories and log_kwargs.get("calories") is not None:
                            log_kwargs["unit"] = "kcal"
                        elif steps is not None:
                            log_kwargs["unit"] = "steps"
                        elif distance_km is not None:
                            log_kwargs["unit"] = "km"
                        elif duration is not None:
                            log_kwargs["unit"] = "min"
                        else:
                            log_kwargs["unit"] = ""

                    # optional 'count' field name check (if your model has it)
                    if "count" in {f.name for f in ActivityLog._meta.get_fields()} and count is not None:
                        log_kwargs["count"] = count

                    # create the log
                    ActivityLog.objects.create(**log_kwargs)
                    logs_created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {logs_created} activity logs for user '{username}' over last {days} days"))
        self.stdout.write(self.style.SUCCESS("Seeding complete. You can login with demo/demo123"))
