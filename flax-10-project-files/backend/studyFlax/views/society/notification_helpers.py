"""
Helpers for building and formatting society update notifications.
"""

def is_only_announcement_changes(changes):
    announcement_keys = {'announcements_added', 'announcements_updated', 'announcements_deleted'}
    event_keys = {'events_added', 'events_updated', 'events_deleted'}
    has_announcements = any(changes.get(key) for key in announcement_keys)
    has_events = any(changes.get(key) for key in event_keys)
    return has_announcements and not has_events

def format_change_list(items, prefix):
    return [f"{prefix}: {item}" for item in items[:3]]

def _event_change_parts(changes):
    return (
        format_change_list(changes.get('events_added', []), 'New event') +
        format_change_list(changes.get('events_updated', []), 'Updated event') +
        format_change_list(changes.get('events_deleted', []), 'Deleted event')
    )

def _announcement_change_parts(changes):
    return (
        format_change_list(changes.get('announcements_added', []), 'New announcement') +
        format_change_list(changes.get('announcements_updated', []), 'Updated announcement') +
        format_change_list(changes.get('announcements_deleted', []), 'Deleted announcement')
    )

def build_change_message(changes):
    parts = _event_change_parts(changes) + _announcement_change_parts(changes)
    return ' | '.join(parts) if parts else None

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
