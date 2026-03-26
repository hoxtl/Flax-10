"""
Analytics API views for study session summaries and progress tracking.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from .analytics_response_builders import build_analytics_response, build_progress_response


def _get_sessions(user, start_date, end_date):
    """Fetch study sessions for the given user and date range."""
    return StudySession.objects.filter(user=user, end_time__gte=start_date, end_time__lte=end_date)

def _time_window(days):
    end_date = timezone.now()
    return end_date - timedelta(days=days), end_date

def _summary_payload(user, days):
    start_date, end_date = _time_window(days)
    sessions = _get_sessions(user, start_date, end_date)
    return build_analytics_response(sessions, days)

def _progress_payload(user, days):
    start_date, end_date = _time_window(days)
    sessions = _get_sessions(user, start_date, end_date)
    events = CalendarEvent.objects.filter(user=user, start_time__gte=start_date, start_time__lte=end_date)
    return build_progress_response(sessions, events, days)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_summary(request):
    """Return a full analytics summary: totals, daily breakdown, and heatmap."""
    days = int(request.GET.get('days', 30))
    return Response(_summary_payload(request.user, days))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress_data(request):
    """Return daily planned vs actual study hours and adherence percentage."""
    days = int(request.GET.get('days', 30))
    return Response(_progress_payload(request.user, days))
