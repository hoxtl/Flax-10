from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import timedelta
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events
from studyFlax.models import Enrollment, CalendarEvent
from studyFlax.serialisers import EnrollmentSerialiser

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def enrollment_list(request):
    if request.method == 'GET':
        return get_enrollments(request)
    return create_enrollments(request)

def get_enrollments(request):
    user = request.user
    enrollments = Enrollment.objects.filter(student=user)
    serialiser = EnrollmentSerialiser(enrollments, many=True)
    return Response(serialiser.data)

def create_enrollments(request):
    serialiser = EnrollmentSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    enrollment = serialiser.save()
    module = enrollment.module
    CalendarEvent.objects.create(
            user=request.user,module=module,
            title=f"Lecture: {module.module_name}",
            start_time=module.start_time,end_time=module.end_time,
            recurrence_rule = module.recurrence_rule,
            location=module.location,
            priority='high',
            source="module_enrollment")
    create_enrollment_deadline_events(request.user, module)
    return Response(EnrollmentSerialiser(enrollment).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def enrollment_detail(request, enrollment_id):
    enrollment = get_object_or_404(Enrollment, id=enrollment_id)
    if request.method == 'GET':
        return Response(EnrollmentSerialiser(enrollment).data)
    return delete_enrollment(request, enrollment)

def delete_enrollment(request, enrollment):
    if enrollment.student != request.user:
        return Response( {"error": "You can only disenroll yourself."}, status = status.HTTP_403_FORBIDDEN)
    
    CalendarEvent.objects.filter( 
        user=request.user,
        module=enrollment.module,
        source__in=["module_enrollment", "module_deadline"]
    ).delete()
    enrollment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

    
