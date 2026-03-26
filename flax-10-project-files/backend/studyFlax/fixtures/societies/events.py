"""
Event templates and date helpers for seeded societies.
"""

from datetime import datetime, timedelta

from django.utils import timezone

EVENT_TEMPLATES = {
    "sports": [
        ("Weekly Training", "Regular training session for all members.", 18, 90, "weekly", 2),
        ("Match Day", "Competitive match against another team.", 14, 120, None, 5),
        ("Fitness Session", "Gym workout with the team.", 17, 60, "weekly", 4),
        ("Social Drinks", "Post-training drinks at the student bar.", 20, 120, None, None),
    ],
    "cultural": [
        ("Weekly Meeting", "Regular society meet-up and planning.", 18, 90, "weekly", 3),
        ("Cultural Night", "Celebrate our heritage with food and performances.", 19, 180, None, 5),
        ("Language Exchange", "Practise languages with native speakers.", 17, 90, "weekly", 1),
        ("Festival Celebration", "Annual festival celebration event.", 18, 180, None, None),
    ],
    "academic": [
        ("Weekly Workshop", "Skill-building workshop for members.", 17, 90, "weekly", 2),
        ("Guest Speaker", "Talk from an industry professional.", 18, 90, None, None),
        ("Study Group", "Collaborative study session.", 14, 120, "weekly", 5),
        ("Competition Prep", "Prepare for upcoming competitions.", 16, 120, None, None),
    ],
    "arts": [
        ("Weekly Practice", "Regular practice session.", 18, 120, "weekly", 3),
        ("Exhibition Opening", "Showcase member work.", 19, 120, None, 5),
        ("Workshop", "Learn new techniques.", 14, 150, None, 5),
        ("Critique Session", "Peer feedback on works in progress.", 17, 90, "biweekly", 1),
    ],
    "social": [
        ("Weekly Social", "Casual hangout for members.", 19, 120, "weekly", 4),
        ("Games Night", "Board games and fun.", 18, 180, "biweekly", 3),
        ("Trip Planning", "Plan upcoming society trips.", 17, 60, None, None),
        ("End of Term Party", "Celebrate the end of term.", 20, 180, None, 5),
    ],
    "gaming": [
        ("Weekly Gaming", "Regular gaming session.", 18, 180, "weekly", 4),
        ("Tournament", "Competitive tournament with prizes.", 14, 240, None, 5),
        ("Casual Play", "Drop-in casual gaming.", 19, 120, "weekly", 1),
        ("LAN Party", "Bring your setup for a LAN event.", 12, 480, None, 5),
    ],
    "music": [
        ("Weekly Rehearsal", "Regular practice session.", 18, 120, "weekly", 2),
        ("Concert", "End of term performance.", 19, 120, None, 5),
        ("Jam Session", "Informal music making.", 17, 120, "weekly", 4),
        ("Open Mic", "Perform for fellow students.", 19, 150, None, 4),
    ],
    "dance": [
        ("Weekly Practice", "Learn and practise choreography.", 18, 90, "weekly", 2),
        ("Showcase", "Performance showcase.", 19, 120, None, 5),
        ("Beginner Class", "Introduction for new dancers.", 17, 60, "weekly", 0),
        ("Social Dance", "Practise with partners.", 19, 120, "biweekly", 4),
    ],
    "religious": [
        ("Weekly Meeting", "Regular gathering and discussion.", 18, 90, "weekly", 3),
        ("Study Circle", "Scripture study and reflection.", 17, 60, "weekly", 1),
        ("Community Event", "Open event for all students.", 14, 120, None, 5),
        ("Charity Drive", "Fundraising for a good cause.", 10, 240, None, 5),
    ],
    "professional": [
        ("Weekly Workshop", "Career skills development.", 18, 90, "weekly", 2),
        ("Networking Event", "Meet industry professionals.", 18, 150, None, 3),
        ("CV Workshop", "Get feedback on your CV.", 14, 120, None, 5),
        ("Mock Interviews", "Practise interview skills.", 17, 120, "biweekly", 4),
    ],
    "volunteering": [
        ("Weekly Volunteering", "Regular volunteering shift.", 10, 180, "weekly", 5),
        ("Planning Meeting", "Organise upcoming activities.", 18, 60, "weekly", 1),
        ("Community Event", "Special volunteering event.", 9, 240, None, 5),
        ("Fundraiser", "Raise money for charity.", 12, 180, None, 5),
    ],
    "media": [
        ("Weekly Meeting", "Editorial planning and updates.", 18, 90, "weekly", 1),
        ("Production Day", "Create content together.", 14, 180, "weekly", 5),
        ("Training Session", "Learn new skills.", 17, 90, None, 3),
        ("Live Event", "Special live broadcast or screening.", 19, 120, None, 4),
    ],
}


def get_events_for_category(category):
    """Return the seeded event templates for one society category."""

    return EVENT_TEMPLATES.get(category, EVENT_TEMPLATES["social"])


def build_event_datetime(hour, duration_mins, day_of_week=None):
    """Build aware start and end datetimes for a seeded society event."""

    base_date = get_next_occurrence(day_of_week)
    start = timezone.make_aware(datetime.combine(base_date, datetime.min.time().replace(hour=hour)))
    end = start + timedelta(minutes=duration_mins)
    return start, end


def get_next_occurrence(day_of_week):
    """Return the next date matching the given weekday number."""

    today = timezone.now().date()
    if day_of_week is None:
        return today + timedelta(days=7)
    days_ahead = day_of_week - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


__all__ = ["build_event_datetime", "get_events_for_category", "get_next_occurrence"]

