"""
Views for listing, creating, updating, and deleting module deadlines.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from studyFlax.models import Deadline, Module
from studyFlax.serialisers import DeadlineSerialiser
from  .deadline_event_helpers import create_deadline_events, sync_deadline_events, delete_deadline_events
from django.utils import timezone

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deadline_list(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    if request.method == 'GET':
        return get_deadlines(module)
    return create_deadline(request, module)

def get_deadlines(module):
    deadlines = Deadline.objects.filter(module=module)
    serialiser = DeadlineSerialiser(deadlines, many=True)
    return Response(serialiser.data)

def create_deadline(request,module):
    serialiser = DeadlineSerialiser(data=request.data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    deadline = serialiser.save(module=module)
    create_deadline_events(deadline)
    return Response(DeadlineSerialiser(deadline).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def deadline_detail(request, deadline_id, module_id):
    deadline = get_object_or_404(Deadline, id=deadline_id, module_id=module_id)
    if request.method == 'GET':
        return Response(DeadlineSerialiser(deadline).data)
    if request.method == 'PUT':
        return update_deadline(request,deadline)
    return delete_deadline(request, deadline)

def update_deadline(request, deadline):
    serialiser = DeadlineSerialiser(deadline, data=request.data, partial=True, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated = serialiser.save()
    sync_deadline_events(updated)
    return Response(DeadlineSerialiser(updated).data)

def delete_deadline(request, deadline):
    delete_deadline_events(deadline)
    deadline.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_deadlines(request):
    base_queryset = Deadline.objects.select_related('module').filter(
        start_due_date__gte=timezone.now()
    )
    if request.user.is_teacher():
        deadlines = base_queryset.filter(module__created_by=request.user)
    else:
        deadlines = base_queryset.filter(module__enrollments__student=request.user)
    deadlines = deadlines.order_by('start_due_date').distinct()[:10]
    return Response(DeadlineSerialiser(deadlines, many=True).data)
    
