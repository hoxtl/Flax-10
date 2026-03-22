"""
Module reading views for listing, editing, and task conversion.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import Module, Reading
from studyFlax.serialisers.modules.reading_serialisers import ReadingSerialiser
from studyFlax.utils.reading_utils import DEFAULT_PAGE_TIME, get_avg_time_per_page
from studyFlax.views.modules.reading_queries import get_suggested_readings
from studyFlax.views.modules.reading_task_service import (
    create_description,
    create_reading_task,
    task_payload,
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reading_list(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    if request.method == 'GET':
        return get_readings(request, module)
    return create_reading(request, module)


def get_readings(request, module):
    readings = Reading.objects.filter(module=module)
    return Response(ReadingSerialiser(readings, many=True, context={'request': request}).data)


def create_reading(request, module):
    serialiser = ReadingSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    reading = serialiser.save(module=module)
    return Response(ReadingSerialiser(reading, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def reading_detail(request, module_id, reading_id):
    reading = get_object_or_404(Reading, id=reading_id, module_id=module_id)
    if request.method == 'GET':
        return Response(ReadingSerialiser(reading, context={'request': request}).data)
    if request.method == 'PUT':
        return update_reading(request, reading)
    return delete_reading(reading)


def update_reading(request, reading):
    serialiser = ReadingSerialiser(reading, data=request.data, partial=True, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(ReadingSerialiser(serialiser.save(), context={'request': request}).data)


def delete_reading(reading):
    reading.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_task(request, reading_id):
    reading = get_object_or_404(Reading, id=reading_id)
    return create_reading_task(request.user, reading)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suggested_readings(request):
    readings = get_suggested_readings(request.user)
    return Response(ReadingSerialiser(readings, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reading_speed(request):
    avg = get_avg_time_per_page(request.user)
    return Response({
        'avg_min_per_page': avg,
        'is_personalised': avg != DEFAULT_PAGE_TIME,
    })
