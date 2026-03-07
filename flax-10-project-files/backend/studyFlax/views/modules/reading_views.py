from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Module, Reading, Task
from studyFlax.serialisers.reading_serialisers import ReadingSerialiser

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reading_list(request, module_id):
    module = get_object_or_404(Module, module_id)
    if request.method == 'GET':
        return get_readings(request, module)
    return create_reading(request, module)

def get_readings(request, module):
    readings = Reading.objects.filter(module=module)
    return Response(ReadingSerialiser(readings, many=True, context={'request':request}).data)

def create_reading(request, module):
    serialiser = ReadingSerialiser(data=request.data, context={'request':request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    reading = serialiser.save(module=module)
    return Response(ReadingSerialiser(reading, context={'request': request}).data, status=status.HTTP_201_CREATED)
