"""
Views for managing tasks and task lists.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from studyFlax.views.tasks.task_view_service import (
    create_task_list_response,
    create_task_response,
    delete_task,
    get_accessible_task,
    get_user_tasks,
    list_task_lists_response,
    list_tasks_response,
    log_task_time_response,
    sync_calendar_event_for_task,
    update_task_list_response,
    update_task_response,
)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_list(request):
    """List all task lists for the user, or create a new one."""

    if request.method == "GET":
        archived = request.query_params.get("archived", "false").lower() == "true"
        return list_task_lists_response(request.user, archived)
    return create_task_list_response(request.data, request.user)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_list_detail(request, list_id):
    """Update or delete a task list."""

    from studyFlax.models.tasks.task_model import TaskList

    task_list = get_object_or_404(TaskList, id=list_id, user=request.user)
    if request.method == "DELETE":
        task_list.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return update_task_list_response(task_list, request.data)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list(request):
    """List all accessible tasks, or create a new one."""

    if request.method == "GET":
        return list_tasks_response(request.user, request.query_params)
    return create_task_response(request.data, request.user)

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    """Update or delete an individual task."""

    task = get_accessible_task(request.user, task_id)
    if request.method == "DELETE":
        delete_task(task)
        return Response(status=status.HTTP_204_NO_CONTENT)
    return update_task_response(task, request.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_task_time(request, task_id):
    """Log time spent on a task in minutes."""

    task = get_accessible_task(request.user, task_id)
    minutes = int(request.data.get("minutes", 0))
    return log_task_time_response(task, request.user, minutes)
