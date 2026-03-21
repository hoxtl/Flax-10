"""
<<<<<<< HEAD
Enrollment views for listing, creating, and deleting module enrolments.
"""

from django.shortcuts import get_object_or_404
=======
Views for listing, creating, and deleting module enrolments.
"""

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
<<<<<<< HEAD
from rest_framework.response import Response

from studyFlax.models import CalendarEvent, Enrollment
from studyFlax.serialisers import EnrollmentSerialiser
from studyFlax.views.modules.enrollment_logic import enroll_user_in_module, is_core_module

=======
from django.shortcuts import get_object_or_404
from studyFlax.views.modules.enrollment_logic import enroll_user_in_module, is_core_module
from studyFlax.models import Enrollment, CalendarEvent
from studyFlax.serialisers import EnrollmentSerialiser
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def enrollment_list(request):
    if request.method == 'GET':
        return get_enrollments(request)
    return create_enrollments(request)

def get_enrollments(request):
    enrollments = Enrollment.objects.filter(student=request.user)
    serialiser = EnrollmentSerialiser(enrollments, many=True)
    return Response(serialiser.data)

def create_enrollments(request):
    serialiser = EnrollmentSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    module = serialiser.validated_data['module']
    enrollment, _created = enroll_user_in_module(request.user, module)
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
<<<<<<< HEAD
        return Response({"error": "You can only unenrol yourself."}, status=status.HTTP_403_FORBIDDEN)
=======
        return Response( {"error": "You can only unenrol yourself."}, status = status.HTTP_403_FORBIDDEN)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if is_core_module(request.user, enrollment.module):
        return Response({"error": "You cannot leave a module that is part of your core course."}, status=status.HTTP_403_FORBIDDEN)
    _remove_enrollment_calendar_events(request.user, enrollment.module)
    return _delete_enrollment_record(enrollment)

def _remove_enrollment_calendar_events(user, module):
    CalendarEvent.objects.filter(
        user=user,
        module=module,
        source__in=['module_enrollment', 'module_deadline'],
    ).delete()

def _delete_enrollment_record(enrollment):
    enrollment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
