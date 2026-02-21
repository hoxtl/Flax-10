from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import timedelta
from studyFlax.models import Enrollment, CalendarEvent
from studyFlax.serialisers import EnrollmentSerialiser


def create_lecture_event(user, module, week):
    start = module.start_time + timedelta(weeks=week)
    end = module.end_time + timedelta(weeks=week)
    CalendarEvent.objects.get_or_create(
        user=user, title=f"Lecture: {module.module_name}", start_time=start,
        defaults={'end_time': end, 'location': module.location,
                  'description': module.module_name,
                  'priority': 'high', 'source': 'module_enrollment'}
    )

def create_lecture_events_for_module(user, module):
    for week in range(10):
        create_lecture_event(user, module, week)

def get_enrollments(request):
    enrollments = Enrollment.objects.filter(student=request.user)
    return Response(EnrollmentSerialiser(enrollments, many=True).data)

def create_enrollment(request):
    serialiser = EnrollmentSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    enrollment = serialiser.save()
    create_lecture_events_for_module(request.user, enrollment.module)
    return Response(EnrollmentSerialiser(enrollment).data, status=status.HTTP_201_CREATED)

def delete_enrollment(request, enrollment):
    if enrollment.student != request.user:
        return Response({"error": "You can only un-enroll yourself."}, status=status.HTTP_403_FORBIDDEN)
    CalendarEvent.objects.filter(user=request.user, module=enrollment.module, source="module_enrollment").delete()
    enrollment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def enrollment_list(request):
    if request.method == 'GET':
        return get_enrollments(request)
    return create_enrollment(request)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def enrollment_detail(request, enrollment_id):
    enrollment = get_object_or_404(Enrollment, id=enrollment_id)
    if request.method == 'GET':
        return Response(EnrollmentSerialiser(enrollment).data)
    return delete_enrollment(request, enrollment)