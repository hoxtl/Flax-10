"""
Views for managing module deadlines.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import Deadline, Module
from studyFlax.serialisers import DeadlineSerialiser
from .deadline_event_helpers import create_deadline_events, delete_deadline_events, sync_deadline_events


def deadline_context(request):
    """Return the serialiser context for deadline views."""
    return {'request': request}

def deadline_payload(deadlines, many=False):
    """Return serialised deadline data."""
    return DeadlineSerialiser(deadlines, many=many).data

def future_deadlines_queryset():
    """Return future deadlines with related module data."""
    return Deadline.objects.select_related('module').filter(start_due_date__gte=timezone.now())

def teacher_deadlines(queryset, user):
    """Return future deadlines for modules owned by the teacher."""
    return queryset.filter(module__created_by=user)

def student_deadlines(queryset, user):
    """Return future deadlines for modules linked to the student."""
    return queryset.filter(module__enrollments__student=user)

def upcoming_deadline_queryset(user):
    base_queryset = future_deadlines_queryset()
    if user.is_teacher():
        return teacher_deadlines(base_queryset, user)
    return student_deadlines(base_queryset, user)

def ordered_upcoming_deadlines(user):
    """Return the next ten unique deadlines for a user."""
    return upcoming_deadline_queryset(user).order_by('start_due_date').distinct()[:10]

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deadline_list(request, module_id):
    module = get_object_or_404(Module, id=module_id)
    if request.method == 'GET':
        return get_deadlines(module)
    return create_deadline(request, module)

def get_deadlines(module):
    deadlines = Deadline.objects.filter(module=module)
    return Response(deadline_payload(deadlines, many=True))

def create_deadline(request, module):
    serialiser = DeadlineSerialiser(data=request.data, context=deadline_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    deadline = serialiser.save(module=module)
    create_deadline_events(deadline)
    return Response(deadline_payload(deadline), status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def deadline_detail(request, deadline_id, module_id):
    """Retrieve, update, or delete a deadline."""
    deadline = get_object_or_404(Deadline, id=deadline_id, module_id=module_id)
    if request.method == 'GET':
        return Response(deadline_payload(deadline))
    if request.method == 'PUT':
        return update_deadline(request, deadline)
    return delete_deadline(deadline)

def update_deadline(request, deadline):
    """Update a deadline and synchronise related events."""
    serialiser = DeadlineSerialiser(deadline, data=request.data, partial=True, context=deadline_context(request))
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated = serialiser.save()
    sync_deadline_events(updated)
    return Response(deadline_payload(updated))

def delete_deadline(deadline):
    """Delete a deadline and its related calendar events."""
    delete_deadline_events(deadline)
    deadline.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_deadlines(request):
    """Return the next ten upcoming deadlines for the user."""
    deadlines = ordered_upcoming_deadlines(request.user)
    return Response(deadline_payload(deadlines, many=True))
