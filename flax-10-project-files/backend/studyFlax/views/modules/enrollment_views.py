from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Enrollment
from studyFlax.serialisers import EnrollmentSerialiser
from studyFlax.models import CalendarEvent
from datetime import timedelta

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

    for week in range(10):
        lecture_start = module.start_time + timedelta(weeks=week)
        lecture_end = module.end_time + timedelta(weeks=week)
        CalendarEvent.objects.get_or_create(
            user=request.user,
            title=f"Lecture: {module.module_name}",
            start_time=lecture_start,
            defaults={
                'end_time': lecture_end,
                'location': module.location,
                'description': module.module_name,
                'priority': 'high',
                'source': 'module_enrollment',
            }
        )
    return Response(EnrollmentSerialiser(enrollment).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def enrollment_detail(request, enrollment_id):
    enrollment = get_object_or_404(Enrollment, id=enrollment_id)
    user = request.user
    if request.method == 'GET':
        return Response(EnrollmentSerialiser(enrollment).data)
    return delete_enrollment(request, enrollment, user)
def delete_enrollment(request, enrollment, user):
    if enrollment.student != user:
        return Response( {"error": "You can only un-enroll yourself."}, status = status.HTTP_403_FORBIDDEN)
    
    CalendarEvent.objects.filter( 
        user=user,
        module=enrollment.module,
        source="module_enrollment").delete()
    enrollment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

    