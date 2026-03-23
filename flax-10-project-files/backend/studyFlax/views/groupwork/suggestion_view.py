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

def _notify_members_of_suggestion(project, suggestion, requester):
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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_suggestion(request, project_id):
    """Create a meeting time suggestion and notify all project members."""

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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_suggestion(request, suggestion_id):
    """Record the current user's acceptance or rejection of a meeting suggestion."""

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

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_suggestion(request, suggestion_id):
    """Delete a meeting suggestion (creator only)."""

    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    if suggestion.suggested_by != request.user:
        return Response({"error": "Only the creator can delete this suggestion"}, status=status.HTTP_403_FORBIDDEN)
    suggestion.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
