from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import Society, SocietyMembership
from studyFlax.serialisers import SocietyListSerialiser
from studyFlax.signals.society_notifications import notify_society_members
from .helpers import handle_image_urls, get_society_or_404, is_society_admin, society_not_found_response, permission_denied_response

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def society_list(request):
    if request.method == 'GET':
        return get_societies(request)
    return create_society(request)

def get_societies(request):
    societies = Society.objects.all()
    data = build_society_list_data(societies, request)
    return Response(data)

def build_society_list_data(societies, request):
    result = []
    for society in societies:
        society_data = SocietyListSerialiser(society, context={'request': request}).data
        membership = get_user_membership(request.user, society)
        society_data['is_member'] = membership is not None
        society_data['is_admin'] = membership.is_admin if membership else False
        result.append(society_data)
    return result

def get_user_membership(user, society):
    try:
        return SocietyMembership.objects.get(user=user, society=society)
    except SocietyMembership.DoesNotExist:
        return None

def create_society(request):
    data = request.data.copy()
    if not data.get('admin_emails'):
        data['admin_emails'] = request.user.email
    serialiser = SocietyListSerialiser(data=data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    society = serialiser.save()
    handle_image_urls(society, request.data)
    SocietyMembership.objects.create(user=request.user, society=society, role='admin')
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_changes(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    changes = request.data
    notification = build_update_notification(society, changes)
    notify_society_members(society, notification)
    return Response({'status': 'published'})

def build_update_notification(society, changes):
    message = build_change_message(changes)
    action_url = get_notification_action_url(society.id, changes)
    return {
        'title': f"{society.name} has been updated",
        'message': message or 'Check out the latest changes.',
        'notification_type': 'society_update',
        'society_id': society.id,
        'action_url': action_url,
    }

def get_notification_action_url(society_id, changes):
    if is_only_announcement_changes(changes):
        return f"/societies?id={society_id}&tab=announcements"
    return f"/societies?id={society_id}"

def is_only_announcement_changes(changes):
    announcement_keys = {'announcements_added', 'announcements_updated', 'announcements_deleted'}
    event_keys = {'events_added', 'events_updated', 'events_deleted'}
    has_announcements = any(changes.get(k) for k in announcement_keys)
    has_events = any(changes.get(k) for k in event_keys)
    return has_announcements and not has_events

def build_change_message(changes):
    parts = []
    parts.extend(format_change_list(changes.get('events_added', []), 'New event'))
    parts.extend(format_change_list(changes.get('events_updated', []), 'Updated event'))
    parts.extend(format_change_list(changes.get('events_deleted', []), 'Deleted event'))
    parts.extend(format_change_list(changes.get('announcements_added', []), 'New announcement'))
    parts.extend(format_change_list(changes.get('announcements_updated', []), 'Updated announcement'))
    parts.extend(format_change_list(changes.get('announcements_deleted', []), 'Deleted announcement'))
    return ' | '.join(parts) if parts else None

def format_change_list(items, prefix):
    return [f"{prefix}: {item}" for item in items[:3]]
