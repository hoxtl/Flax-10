from studyFlax.models.society import SocietyCalendarSync, SocietyEvent
from studyFlax.serialisers.society_serialisers import SocietyEventCalendarSerialiser


def get_synced_society_events(user):
    """Get all society events from societies the user has synced."""
    synced_society_ids = get_synced_society_ids(user)
    if not synced_society_ids:
        return []
    events = SocietyEvent.objects.filter(society_id__in=synced_society_ids).select_related('society')
    return SocietyEventCalendarSerialiser(events, many=True).data


def get_synced_society_ids(user):
    """Get IDs of societies the user has synced their calendar with."""
    return list(SocietyCalendarSync.objects.filter(user=user).values_list('society_id', flat=True))
