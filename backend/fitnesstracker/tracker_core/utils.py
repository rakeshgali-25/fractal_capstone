# tracker_core/utils.py
from datetime import date, timedelta
from django.db.models import Sum

UNIT_FIELD = {
    'min': 'duration_minutes',
    'minutes': 'duration_minutes',
    'km': 'distance_km',
    'distance': 'distance_km',
    'steps': 'steps',
    'kcal': 'calories',
    'calories': 'calories',
    'sessions': 'count',
    'count': 'count',
}

def get_period_range_for_date(target_date, freq):
    """
    Return (start_date, end_date) inclusive for the given freq and target_date (both date objects).
    """
    if freq == 'daily':
        return target_date, target_date
    if freq == 'weekly':
        # assume ISO week starting Monday
        start = target_date - timedelta(days=target_date.weekday())
        end = start + timedelta(days=6)
        return start, end
    if freq == 'monthly':
        start = target_date.replace(day=1)
        # end: month end — build naive by incrementing month
        if target_date.month == 12:
            end = target_date.replace(day=31)
        else:
            next_month = target_date.replace(month=target_date.month+1, day=1)
            end = next_month - timedelta(days=1)
        return start, end
    # fallback: whole history
    return date(1970,1,1), target_date
