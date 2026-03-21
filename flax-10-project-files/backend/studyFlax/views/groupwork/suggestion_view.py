"""
Views for managing meeting time suggestions and responses within group projects.
"""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from studyFlax.models.groupwork.groupwork_model import GroupProject, MeetingSuggestion, MeetingResponse
from studyFlax.models.notifications.notification_model import Notification

<<<<<<< HEAD

def _send_suggestion_updates(project, suggestion, requester):
=======
def _notify_members_of_suggestion(project, suggestion, requester):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    """Notify all project members except the requester of a new meeting suggestion."""
    memberships = project.memberships.exclude(user=requester).select_related("user")
    time_str = suggestion.start_time.strftime('%a %d %b at %I:%M %p')
    notifications = [
        Notification(
            user=m.user,
            title=f"New meeting suggestion for {project.name}",
            message=f"{requester.username} suggested a meeting on {time_str}.",
            notification_type="meeting_suggestion",
            action_url=f"group-work_{project.id}_availability",
        )
        for m in memberships
    ]
    Notification.objects.bulk_create(notifications)

<<<<<<< HEAD
def _suggestion_times_or_error(data):
    start_time = parse_datetime(data.get("start_time") or "")
    end_time = parse_datetime(data.get("end_time") or "")
    if start_time and end_time:
        return (start_time, end_time), None
    return None, Response({"error": "start_time and end_time are required"}, status=status.HTTP_400_BAD_REQUEST)

def _save_suggestion(project, user, times):
    return MeetingSuggestion.objects.create(
        project=project,
        suggested_by=user,
        start_time=times[0],
        end_time=times[1],
    )

def _create_suggestion_result(user, data, project_id):
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=user), id=project_id)
    times, error_response = _suggestion_times_or_error(data)
    if error_response:
        return None, error_response
    suggestion = _save_suggestion(project, user, times)
    _send_suggestion_updates(project, suggestion, user)
    return {"id": suggestion.id, "message": "Suggestion created successfully"}, None

def _suggestion_vote_or_error(data):
    vote = data.get("status")
    if vote in ["accepted", "rejected"]:
        return vote, None
    return None, Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

def _response_access_error(user, suggestion):
    if suggestion.project.memberships.filter(user=user).exists():
        return None
    return Response({"error": "Not a member of this project"}, status=status.HTTP_403_FORBIDDEN)

def _response_payload(response):
    return {"id": response.id, "status": response.status, "message": "Response recorded"}

def _suggestion_response(request, suggestion_id):
    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    error_response = _response_access_error(request.user, suggestion)
    if error_response:
        return error_response
    vote, error_response = _suggestion_vote_or_error(request.data)
    if error_response:
        return error_response
    response, _ = MeetingResponse.objects.update_or_create(
        suggestion=suggestion, user=request.user, defaults={"status": vote},
    )
    return Response(_response_payload(response))

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_suggestion(request, project_id):
    """Create a meeting time suggestion and notify all project members."""
<<<<<<< HEAD
    payload, error_response = _create_suggestion_result(request.user, request.data, project_id)
    if error_response:
        return error_response
    return Response(payload, status=status.HTTP_201_CREATED)
=======
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    start_time = parse_datetime(request.data.get("start_time") or "")
    end_time = parse_datetime(request.data.get("end_time") or "")
    if not start_time or not end_time:
        return Response({"error": "start_time and end_time are required"}, status=status.HTTP_400_BAD_REQUEST)
    suggestion = MeetingSuggestion.objects.create(
        project=project, suggested_by=request.user, start_time=start_time, end_time=end_time,
    )
    _notify_members_of_suggestion(project, suggestion, request.user)
    return Response({"id": suggestion.id, "message": "Suggestion created successfully"}, status=status.HTTP_201_CREATED)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_suggestion(request, suggestion_id):
    """Record the current user's acceptance or rejection of a meeting suggestion."""
<<<<<<< HEAD
    return _suggestion_response(request, suggestion_id)
=======
    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    if not suggestion.project.memberships.filter(user=request.user).exists():
        return Response({"error": "Not a member of this project"}, status=status.HTTP_403_FORBIDDEN)
    vote = request.data.get("status")
    if vote not in ["accepted", "rejected"]:
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
    response, _ = MeetingResponse.objects.update_or_create(
        suggestion=suggestion, user=request.user, defaults={"status": vote},
    )
    return Response({"id": response.id, "status": response.status, "message": "Response recorded"})
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_suggestion(request, suggestion_id):
    """Delete a meeting suggestion (creator only)."""
    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    if suggestion.suggested_by != request.user:
        return Response({"error": "Only the creator can delete this suggestion"}, status=status.HTTP_403_FORBIDDEN)
    suggestion.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
