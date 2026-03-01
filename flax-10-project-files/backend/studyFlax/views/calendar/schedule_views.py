from stufyFlax.models.calendar.scheduleModel import Schedule
from studyFlax.serialisers import ScheduleSerialiser

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def schedule_list(request):
    return JsonResponse(ScheduleSerialiser.data)