from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import timedelta

from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.serialisers.task_serialisers import TaskSerialiser, TaskListSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent


def get_user_lists(user, archived=False):
    return TaskList.objects.filter(user=user, archived=archived).order_by("created_at")


def get_user_tasks(user, params):
    qs = Task.objects.filter(
        Q(user=user) | Q(assigned_to=user) | Q(group_project__memberships__user=user)
    ).distinct()
    
    if params.get("group_project"):
        qs = qs.filter(group_project_id=params["group_project"])
    if params.get("list"):
        qs = qs.filter(task_list_id=params["list"])
    if params.get("module"):
        qs = qs.filter(module_id=params["module"])
    if params.get("completed"):
        qs = qs.filter(completed=params["completed"] == "true")
    return qs.order_by("completed", "priority", "due_date")


def _task_event_qs(task: Task):
    return CalendarEvent.objects.filter(
        user=task.user,
        source="task",
        external_id=str(task.id),
    )


def sync_calendar_event_for_task(task: Task):
    should_exist = bool(task.due_date) and not task.completed
    existing_qs = _task_event_qs(task)

    if not should_exist:
        existing_qs.delete()
        return

    blocks = max(1, int(task.estimated_blocks or 1))
    duration_minutes = max(25, blocks * 25)
    event_payload = dict(
        title=task.title,
        start_time=task.due_date,
        end_time=task.due_date + timedelta(minutes=duration_minutes),
        description=task.description or "",
        priority=task.priority or "medium",
    )

    if existing_qs.exists():
        existing_qs.update(**event_payload)
        return

    CalendarEvent.objects.create(
        user=task.user,
        source="task",
        external_id=str(task.id),
        **event_payload,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_list(request):
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
    task_list = get_object_or_404(TaskList, id=list_id, user=request.user)

    if request.method == "DELETE":
        task_list.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    data = request.data
    if data.get("archived") is False and getattr(task_list, "archived", False):
        Task.objects.filter(task_list=task_list).update(completed=True)

    serialiser = TaskListSerialiser(task_list, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list(request):
    if request.method == "GET":
        tasks = get_user_tasks(request.user, request.query_params)
        return Response(TaskSerialiser(tasks, many=True).data)

    serialiser = TaskSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    task = serialiser.save(user=request.user)
    sync_calendar_event_for_task(task)
    return Response(TaskSerialiser(task).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    task = get_object_or_404(
        Task.objects.filter(
            Q(user=request.user) | Q(group_project__memberships__user=request.user)
        ).distinct(),
        id=task_id
    )

    if request.method == "DELETE":
        _task_event_qs(task).delete()
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serialiser = TaskSerialiser(task, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    updated_task = serialiser.save()
    sync_calendar_event_for_task(updated_task)
    return Response(TaskSerialiser(updated_task).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_task_time(request, task_id):
    task = get_object_or_404(
        Task.objects.filter(
            Q(user=request.user) | Q(group_project__memberships__user=request.user)
        ).distinct(),
        id=task_id
    )
    minutes = int(request.data.get("minutes", 0))
    task.time_spent_minutes += minutes
    task.save()
    return Response({"time_spent_minutes": task.time_spent_minutes})
