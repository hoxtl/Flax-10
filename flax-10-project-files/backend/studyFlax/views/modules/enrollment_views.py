"""
Views for listing, creating, and deleting module enrolments.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.views.modules.enrollment_logic import enroll_user_in_module, is_core_module
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
    
    # Helper handles enrollment and event creation for consistency
    module = serialiser.validated_data['module']
    enrollment, _ = enroll_user_in_module(request.user, module)
    
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
    if is_core_module(request.user, enrollment.module):
        return Response({"error": "You cannot leave a module that is part of your core course."}, status=status.HTTP_403_FORBIDDEN)
    CalendarEvent.objects.filter( 
        user=request.user,
        module=enrollment.module,
        source__in=["module_enrollment", "module_deadline"]
    ).delete()
    enrollment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

