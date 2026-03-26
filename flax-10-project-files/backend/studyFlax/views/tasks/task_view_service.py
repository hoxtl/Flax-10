"""
Service helpers for task and task list view flows.
"""

from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.serialisers.tasks.task_serialisers import TaskListSerialiser, TaskSerialiser
from studyFlax.utils.reading_utils import update_reading_estimates


def get_user_lists(user, archived=False):
    return TaskList.objects.filter(user=user, archived=archived).order_by("created_at")

def base_user_tasks(user):
    return Task.objects.filter(
        Q(user=user) | Q(assigned_to=user) | Q(group_project__memberships__user=user)
    ).distinct()

def apply_group_project_filter(queryset, params):
    group_project = params.get("group_project")
    return queryset.filter(group_project_id=group_project) if group_project else queryset

def apply_task_list_filter(queryset, params):
    task_list_id = params.get("list")
    return queryset.filter(task_list_id=task_list_id) if task_list_id else queryset

def apply_module_filter(queryset, params):
    module_id = params.get("module")
    return queryset.filter(module_id=module_id) if module_id else queryset

def apply_completed_filter(queryset, params):
    completed = params.get("completed")
    if completed is None:
        return queryset
    return queryset.filter(completed=completed == "true")

def get_user_tasks(user, params):
    queryset = base_user_tasks(user)
    queryset = apply_group_project_filter(queryset, params)
    queryset = apply_task_list_filter(queryset, params)
    queryset = apply_module_filter(queryset, params)
    queryset = apply_completed_filter(queryset, params)
    return queryset.order_by("completed", "priority", "due_date")

def task_event_qs(task):
    return CalendarEvent.objects.filter(user=task.user, source="task", external_id=str(task.id))

def build_task_event_payload(task):
    blocks = max(1, int(task.estimated_blocks or 1))
    duration_minutes = max(25, blocks * 25)
    return {
        "title": task.title,
        "start_time": task.due_date,
        "end_time": task.due_date + timedelta(minutes=duration_minutes),
        "description": task.description or "",
        "priority": task.priority or "medium",
    }

def sync_calendar_event_for_task(task):
    existing_qs = task_event_qs(task)
    if not (bool(task.due_date) and not task.completed):
        existing_qs.delete()
        return

    payload = build_task_event_payload(task)
    upsert_task_event(task, existing_qs, payload)

def upsert_task_event(task, existing_qs, payload):
    if existing_qs.exists():
        existing_qs.update(**payload)
        return
    create_task_event(task, payload)

def create_task_event(task, payload):
    CalendarEvent.objects.create(user=task.user, source="task", external_id=str(task.id), **payload)

def list_task_lists_response(user, archived):
    return Response(TaskListSerialiser(get_user_lists(user, archived=archived), many=True).data)

def create_task_list_response(data, user):
    serialiser = TaskListSerialiser(data=data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(user=user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

def archive_open_tasks(task_list, data):
    if data.get("archived") is False and getattr(task_list, "archived", False):
        task_list.tasks.filter(completed=False).update(completed=True)

def update_task_list_response(task_list, data):
    archive_open_tasks(task_list, data)
    serialiser = TaskListSerialiser(task_list, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)

def list_tasks_response(user, params):
    return Response(TaskSerialiser(get_user_tasks(user, params), many=True).data)

def create_task_response(data, user):
    serialiser = TaskSerialiser(data=data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    task = serialiser.save(user=user)
    sync_calendar_event_for_task(task)
    return Response(TaskSerialiser(task).data, status=status.HTTP_201_CREATED)

def get_accessible_task(user, task_id):
    return get_object_or_404(
        Task.objects.filter(Q(user=user) | Q(group_project__memberships__user=user)).distinct(),
        id=task_id,
    )

def delete_task(task):
    task_event_qs(task).delete()
    task.delete()

def update_task_response(task, data):
    serialiser = TaskSerialiser(task, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated_task = serialiser.save()
    sync_calendar_event_for_task(updated_task)
    return Response(TaskSerialiser(updated_task).data)

def log_task_time_response(task, user, minutes):
    task.time_spent_minutes += minutes
    task.save()
    if task.reading_id or task.page_count:
        update_reading_estimates(user)
    return Response({"time_spent_minutes": task.time_spent_minutes})
