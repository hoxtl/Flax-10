from django.db.models import Q
from datetime import datetime

def filter_events_by_date_range(queryset, params):
    start = params.get('start')
    end = params.get('end')
    if start:
        queryset = queryset.filter(start_time__gte=start)
    if end:
        queryset = queryset.filter(end_time__lte=end)
    return queryset

def check_event_overlap(user, event_data):
    start = event_data['start_time']
    end = event_data['end_time']
    
    overlapping = user.events.filter(Q(start_time__lt=end) & Q(end_time__gt=start))
    return overlapping.exists()

def parse_date_param(date_string):
    if not date_string:
        return None
    return datetime.fromisoformat(date_string.replace('Z', '+00:00'))