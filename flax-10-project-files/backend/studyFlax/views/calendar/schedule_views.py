from studyFlax.models.calendar.scheduleModel import Schedule
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers import ScheduleSerialiser
from .auto_scheduler_views import build_auto_schedule

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def schedule_list(request):
    if request.method == 'GET':
        schedules = Schedule.objects.filter(user=request.user).prefetch_related('event_allocations__event', 'deadlines')
        return Response(ScheduleSerialiser(schedules, many=True).data)
    return build_auto_schedule(request)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def schedule_detail(request, schedule_id):
    schedule = get_object_or_404(Schedule, id=schedule_id, user=request.user)
    if request.method == 'GET':
        return Response(ScheduleSerialiser(schedule).data)

    schedule.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)