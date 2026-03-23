"""
Views for managing tasks and task lists.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import timedelta

from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser, TaskListSerialiser
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.utils.reading_utils import update_reading_estimates

def get_user_lists(user, archived=False):
    """Return task lists for the given user, optionally filtered by archived state."""
    return TaskList.objects.filter(user=user, archived=archived).order_by("created_at")

def _base_user_tasks(user):
    return Task.objects.filter(
        Q(user=user) | Q(assigned_to=user) | Q(group_project__memberships__user=user)
    ).distinct()

def _apply_group_project_filter(qs, params):
    group_project = params.get("group_project")
    return qs.filter(group_project_id=group_project) if group_project else qs

def _apply_task_list_filter(qs, params):
    task_list_id = params.get("list")
    return qs.filter(task_list_id=task_list_id) if task_list_id else qs

def _apply_module_filter(qs, params):
    module_id = params.get("module")
    return qs.filter(module_id=module_id) if module_id else qs

def _apply_completed_filter(qs, params):
    completed = params.get("completed")
    if completed is None:
        return qs
    return qs.filter(completed=completed == "true")

def get_user_tasks(user, params):
    """Return all tasks accessible to the user, with optional query param filters applied."""
    qs = _base_user_tasks(user)
    qs = _apply_group_project_filter(qs, params)
    qs = _apply_task_list_filter(qs, params)
    qs = _apply_module_filter(qs, params)
    qs = _apply_completed_filter(qs, params)
    return qs.order_by("completed", "priority", "due_date")

def _task_event_qs(task: Task):
    """Return the queryset of calendar events linked to the given task."""
    return CalendarEvent.objects.filter(user=task.user, source="task", external_id=str(task.id))

def _build_task_event_payload(task):
    """Build the calendar event field dict for a task."""
    blocks = max(1, int(task.estimated_blocks or 1))
    duration_minutes = max(25, blocks * 25)
    return {
        'title': task.title,
        'start_time': task.due_date,
        'end_time': task.due_date + timedelta(minutes=duration_minutes),
        'description': task.description or "",
        'priority': task.priority or "medium",
    }

def _upsert_task_event(task, existing_qs, event_payload):
    """Update an existing task calendar event or create a new one."""
    if existing_qs.exists():
        existing_qs.update(**event_payload)
        return
    CalendarEvent.objects.create(user=task.user, source="task", external_id=str(task.id), **event_payload)

def sync_calendar_event_for_task(task: Task):
    """Ensure the task's calendar event reflects its current due date and state."""
    existing_qs = _task_event_qs(task)
    if not (bool(task.due_date) and not task.completed):
        existing_qs.delete()
        return
    _upsert_task_event(task, existing_qs, _build_task_event_payload(task))

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_list(request):
    """List all task lists for the user, or create a new one."""
    if request.method == "GET":
        archived = request.query_params.get("archived", "false").lower() == "true"
        lists = get_user_lists(request.user, archived=archived)
        return Response(TaskListSerialiser(lists, many=True).data)

    serialiser = TaskListSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(user=request.user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_list_detail(request, list_id):
    """Update or delete a task list."""
    task_list = get_object_or_404(TaskList, id=list_id, user=request.user)
    if request.method == "DELETE":
        task_list.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    data = request.data
    if data.get("archived") is False and getattr(task_list, "archived", False):
        task_list.tasks.filter(completed=False).update(completed=True)
    serialiser = TaskListSerialiser(task_list, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list(request):
    """List all accessible tasks, or create a new one."""
    if request.method == "GET":
        tasks = get_user_tasks(request.user, request.query_params)
        return Response(TaskSerialiser(tasks, many=True).data)

    serialiser = TaskSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    task = serialiser.save(user=request.user)
    sync_calendar_event_for_task(task)
    return Response(TaskSerialiser(task).data, status=status.HTTP_201_CREATED)

def _handle_task_delete(task):
    """Delete a task and its associated calendar event."""
    _task_event_qs(task).delete()
    task.delete()

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    """Update or delete an individual task."""
    task = get_object_or_404(
        Task.objects.filter(Q(user=request.user) | Q(group_project__memberships__user=request.user)).distinct(),
        id=task_id,
    )
    if request.method == "DELETE":
        _handle_task_delete(task)
        return Response(status=status.HTTP_204_NO_CONTENT)
    serialiser = TaskSerialiser(task, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated_task = serialiser.save()
    sync_calendar_event_for_task(updated_task)
    return Response(TaskSerialiser(updated_task).data)

def _is_reading_task(task):
    """Return True if the task is linked to a reading or has a page count."""
    return bool(task.reading_id or task.page_count)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_task_time(request, task_id):
    """Log time spent on a task in minutes."""
    task = get_object_or_404(
        Task.objects.filter(
            Q(user=request.user) | Q(group_project__memberships__user=request.user)
        ).distinct(),
        id=task_id
    )
    minutes = int(request.data.get("minutes", 0))
    task.time_spent_minutes += minutes
    task.save()
    if _is_reading_task(task):
        update_reading_estimates(request.user)
    return Response({"time_spent_minutes": task.time_spent_minutes})
