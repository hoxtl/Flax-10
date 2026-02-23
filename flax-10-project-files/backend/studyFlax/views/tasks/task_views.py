from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.serialisers.task_serialisers import TaskSerialiser, TaskListSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent


def get_user_lists(user):
    return TaskList.objects.filter(user=user).order_by("created_at")


def get_user_tasks(user, params):
    qs = Task.objects.filter(user=user)
    if params.get("list"):
        qs = qs.filter(task_list_id=params["list"])
    if params.get("module"):
        qs = qs.filter(module_id=params["module"])
    if params.get("completed"):
        qs = qs.filter(completed=params["completed"] == "true")
    return qs.order_by("completed", "priority", "due_date")


def create_calendar_event_for_task(task: Task):
    if not task.add_to_calendar or not task.due_date:
        return
    CalendarEvent.objects.create(
        user=task.user,
        title=f"Task: {task.title}",
        start_time=task.due_date,
        end_time=task.due_date,
        description=task.description or "",
        source="task",
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_list(request):
    if request.method == "GET":
        lists = get_user_lists(request.user)
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

    serialiser = TaskListSerialiser(task_list, data=request.data, partial=True)
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
    create_calendar_event_for_task(task)
    return Response(TaskSerialiser(task).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)

    if request.method == "DELETE":
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serialiser = TaskSerialiser(task, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_task_time(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    minutes = int(request.data.get("minutes", 0))
    task.time_spent_minutes += minutes
    task.save()
    return Response({"time_spent_minutes": task.time_spent_minutes})