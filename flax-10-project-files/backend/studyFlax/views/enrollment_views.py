from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from studyFlax.models import Enrollment
from studyFlax.serialisers import EnrollmentSerialiser

@api_view(['GET', 'POST'])
def enrollment_list(request):
    if request.method == 'GET':
        return get_enrollments(request)
    return create_enrollments(request)

def get_enrollments(request):
    enrollments = Enrollment.objects.all()
    serialiser = EnrollmentSerialiser(enrollments, many=True)
    return Response(serialiser.data)

def create_enrollments(request):
    serialiser = EnrollmentSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    enrollment = serialiser.save()
    return Response(EnrollmentSerialiser(enrollment).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
def enrollment_detail(request, enrollment_id):
    enrollment = get_object_or_404(Enrollment, id=enrollment_id)
    user = request.user
    if request.method == 'GET':
        return Response(EnrollmentSerialiser(enrollment).data)
    return delete_enrollment(request, enrollment, user)
def delete_enrollment(request, enrollment, user):
    if enrollment.student != user:
        return Response( {"error": "You can only disenroll yourself."}, status = status.HTTP_403_FORBIDDEN)
    enrollment.delete()
    return Response ( {"message": "Successfully disenrolled from the module."}, status=status.HTTP_204_NO_CONTENT)

    