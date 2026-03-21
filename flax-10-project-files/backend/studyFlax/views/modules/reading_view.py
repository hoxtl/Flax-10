"""
<<<<<<< HEAD
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
from studyFlax.views.modules.reading_task_service import create_reading_task

=======
Views for listing, creating, and managing module reading assignments.
"""

import math
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Module, Reading, Task, Enrollment
from studyFlax.models.tasks.task_model import TaskList
from studyFlax.serialisers.modules.reading_serialisers import ReadingSerialiser
from studyFlax.utils.reading_utils import estimated_time_reading, get_avg_time_per_page, DEFAULT_PAGE_TIME, MINUTES_PER_BLOCK
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reading_list(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    if request.method == 'GET':
        return get_readings(request, module)
    return create_reading(request, module)

def get_readings(request, module):
    readings = Reading.objects.filter(module=module)
<<<<<<< HEAD
    return Response(ReadingSerialiser(readings, many=True, context={'request': request}).data)

def create_reading(request, module):
    serialiser = ReadingSerialiser(data=request.data, context={'request': request})
=======
    return Response(ReadingSerialiser(readings, many=True, context={'request':request}).data)

def create_reading(request, module):
    serialiser = ReadingSerialiser(data=request.data, context={'request':request})
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    reading = serialiser.save(module=module)
    return Response(ReadingSerialiser(reading, context={'request': request}).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def reading_detail(request, module_id, reading_id):
    reading = get_object_or_404(Reading, id=reading_id, module_id=module_id)
<<<<<<< HEAD
    if request.method == 'GET':
        return Response(ReadingSerialiser(reading, context={'request': request}).data)
    if request.method == 'PUT':
=======
    if request.method == 'GET': 
        return Response(ReadingSerialiser(reading, context={'request':request}).data)
    if request.method == 'PUT': 
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        return update_reading(request, reading)
    return delete_reading(reading)

def update_reading(request, reading):
<<<<<<< HEAD
    serialiser = ReadingSerialiser(reading, data=request.data, partial=True, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(ReadingSerialiser(serialiser.save(), context={'request': request}).data)
=======
    serialiser = ReadingSerialiser(reading, data=request.data, partial=True, context={'request':request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(ReadingSerialiser(serialiser.save(), context={'request':request}).data)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def delete_reading(reading):
    reading.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def load_task(request, reading_id):
    reading = get_object_or_404(Reading, id=reading_id)
    return create_reading_task(request.user, reading)

<<<<<<< HEAD
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
=======
def get_reading_list(user, module=None):
    if module:
        new_name = f"{module.module_code} - {module.module_name}"
        module_list = TaskList.objects.filter(
            user=user, name=new_name, archived=False,
        ).first()
        if module_list:
            return module_list
        legacy = TaskList.objects.filter(
            user=user, name=f"Reading List - {module.module_name}", archived=False,
        ).first()
        if legacy:
            return legacy
    return TaskList.objects.filter(user=user, name__icontains='reading', archived=False,).first()

def create_reading_task(user, reading):
    estimated = estimated_time_reading(reading, user)
    task = Task.objects.create(
        user=user,
        title=reading.title,
        description=create_description(reading),
        due_date=reading.deadline,
        module=reading.module,
        priority='medium',
        estimated_blocks=max(1,math.ceil(estimated/MINUTES_PER_BLOCK)),
        reading=reading,
        task_list=get_reading_list(user, reading.module),
        page_count=reading.page_count(),
    )
    return Response(task_payload(task), status=status.HTTP_201_CREATED)

def create_description(reading):
    parts = []
    if reading.chapter:
        parts.append(reading.chapter)
    pages = reading.page_count()
    if pages and pages > 0:
        parts.append(f"{pages} pages (pp. {reading.start_page}–{reading.end_page})")
    return ' · '.join(parts) if parts else reading.title

def task_payload(task):
    return {
        'id': task.id,
        'title': task.title,
        'due_date':task.due_date,
        'estimated_blocks':task.estimated_blocks,
        'reading_id': task.reading_id,
        'task_list': task.task_list_id,
        'page_count': task.page_count,
    }

def enrolled_module_ids(user):
    return Enrollment.objects.filter(student=user).values_list('module_id', flat=True)

def added_readings(user):
    return Task.objects.filter(user=user, reading__isnull=False).values_list('reading_id', flat=True)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suggested_readings(request):
    """
    Returns readings from modules the user is enrolled in.
    Those that have not been converted to a task yet by the user.
    """
    readings = Reading.objects.filter(
        module_id__in = enrolled_module_ids(request.user),
    ).exclude( id__in = added_readings(request.user),
    ).select_related('module')
    return Response(ReadingSerialiser(readings, many=True, context={'request': request}).data)

@api_view(['GET']) 
@permission_classes([IsAuthenticated])
def reading_speed(request):
    avg = get_avg_time_per_page(request.user)
    return Response({'avg_min_per_page': avg,
                     'is_personalised': avg != DEFAULT_PAGE_TIME})

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
