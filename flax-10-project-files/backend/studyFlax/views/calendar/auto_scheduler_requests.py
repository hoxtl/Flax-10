"""
Auto scheduler request validation.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import Deadline
from studyFlax.serialisers import AutoScheduleRequestSerialiser


def _validate_auto_request(request):
    serialiser = AutoScheduleRequestSerialiser(data=request.data)
    if not serialiser.is_valid():
        return None, None, Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    payload = serialiser.validated_data
    deadline_map = _deadline_map(payload)
    deadlines = _enrolled_deadlines(request.user, deadline_map)
    if len(deadlines) != len(deadline_map):
        return None, None, Response({"detail": "Invalid deadlines."}, status=status.HTTP_400_BAD_REQUEST)
    return payload, deadline_map, deadlines

<<<<<<< HEAD
def _deadline_map(payload):
    return {item["deadline_id"]: item["ideal_minutes_per_day"] for item in payload["deadline_preferences"]}

=======

def _deadline_map(payload):
    return {item["deadline_id"]: item["ideal_minutes_per_day"] for item in payload["deadline_preferences"]}


>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _enrolled_deadlines(user, deadline_map):
    return list(
        Deadline.objects.filter(id__in=deadline_map.keys(), module__enrollments__student=user, start_due_date__gte=timezone.now())
        .distinct()
        .order_by("start_due_date")
    )
