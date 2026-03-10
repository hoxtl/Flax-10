from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.groupwork.groupwork_models import GroupProject, GroupMembership
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.views.calendar.event_helpers import expand_recurring_events

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def group_availability(request, project_id):
    project = get_object_or_404(
        GroupProject.objects.filter(memberships__user=request.user),
        id=project_id,
    )
    
    # 1. Get all members
    memberships = project.memberships.select_related("user").all()
    members = [m.user for m in memberships]
    
    # 2. Identify shared calendars - NO LONGER REQUIRED FOR BUSY/FREE CHECK
    # (users can see busy status within group projects but not detailed calendar unless shared)
    
    # 3. Define time range (next 7 days, 9 AM - 6 PM)
    now = timezone.now()
    start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=7)
    
    # 4. Fetch and expand events for all members
    user_events = {}
    for user in members:
        qs = CalendarEvent.objects.filter(
            user=user,
            start_time__lte=end_date,
            end_time__gte=start_date
        )
        expanded = expand_recurring_events(qs, start_date, end_date)
        user_events[user.id] = expanded
            
    # 5. Calculate availability scores for slots
    # Slots: 1-hour increments during "business hours" (9-18)
    suggestions = []
    
    for day_offset in range(7):
        day = start_date + timedelta(days=day_offset)
        # Skip weekends for default suggestions? Let's keep them for now but maybe prioritize weekdays.
        for hour in range(9, 18):
            slot_start = day.replace(hour=hour)
            slot_end = slot_start + timedelta(hours=1)
            
            if slot_start < now:
                continue
                
            slot_members = []
            free_count = 0
            
            for m in memberships:
                u = m.user
                is_free = True
                has_data = True # Within a group, we can always check busy/free
                
                # Check overlap with expanded events
                for ev in user_events[u.id]:
                    if ev.start_time < slot_end and ev.end_time > slot_start:
                        is_free = False
                        break
                
                if is_free:
                    free_count += 1
                    
                slot_members.append({
                    "id": u.id,
                    "name": u.username,
                    "initials": (u.first_name[:1] + u.last_name[:1]).upper() if u.first_name and u.last_name else u.username[:2].upper(),
                    "is_free": is_free,
                    "has_data": has_data
                })
            
            suggestions.append({
                "start": slot_start.isoformat(),
                "label": slot_start.strftime("%a %I%p").replace(" 0", " "), # e.g. "Mon 10am"
                "free_count": free_count,
                "total_count": len(members),
                "members": slot_members
            })

    # 6. Sort and return top 5
    # High score first, then sooner date
    suggestions.sort(key=lambda x: (-x["free_count"], x["start"]))
    
    return Response({
        "suggestions": suggestions[:5]
    })
