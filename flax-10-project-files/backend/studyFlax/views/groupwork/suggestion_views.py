from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from studyFlax.models.groupwork.groupwork_models import GroupProject, MeetingSuggestion, MeetingResponse
from studyFlax.models.notifications.notificationModel import Notification

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_suggestion(request, project_id):
    project = get_object_or_404(
        GroupProject.objects.filter(memberships__user=request.user),
        id=project_id,
    )
    
    start_time_str = request.data.get("start_time")
    end_time_str = request.data.get("end_time")
    
    if not start_time_str or not end_time_str:
        return Response({"error": "start_time and end_time are required"}, status=status.HTTP_400_BAD_REQUEST)
        
    start_time = parse_datetime(start_time_str)
    end_time = parse_datetime(end_time_str)
    
    if start_time is None or end_time is None:
        return Response({"error": "Invalid datetime format"}, status=status.HTTP_400_BAD_REQUEST)
    
    suggestion = MeetingSuggestion.objects.create(
        project=project,
        suggested_by=request.user,
        start_time=start_time,
        end_time=end_time
    )
    
    # Notify other members
    memberships = project.memberships.exclude(user=request.user).select_related("user")
    for membership in memberships:
        Notification.objects.create(
            user=membership.user,
            title=f"New meeting suggestion for {project.name}",
            message=f"{request.user.username} suggested a meeting on {suggestion.start_time.strftime('%a %d %b at %I:%M %p')}.",
            notification_type="meeting_suggestion",
            action_url=f"group-work_{project.id}_availability"
        )
    
    return Response({
        "id": suggestion.id,
        "message": "Suggestion created successfully"
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_to_suggestion(request, suggestion_id):
    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    # Check if user is a member of the project
    if not suggestion.project.memberships.filter(user=request.user).exists():
        return Response({"error": "Not a member of this project"}, status=status.HTTP_403_FORBIDDEN)
    
    vote = request.data.get("status") # 'accepted' or 'rejected'
    if vote not in ["accepted", "rejected"]:
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
    
    response, created = MeetingResponse.objects.update_or_create(
        suggestion=suggestion,
        user=request.user,
        defaults={"status": vote}
    )
    
    return Response({
        "id": response.id,
        "status": response.status,
        "message": "Response recorded"
    })

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_suggestion(request, suggestion_id):
    suggestion = get_object_or_404(MeetingSuggestion, id=suggestion_id)
    if suggestion.suggested_by != request.user:
        return Response({"error": "Only the creator can delete this suggestion"}, status=status.HTTP_403_FORBIDDEN)
    suggestion.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
