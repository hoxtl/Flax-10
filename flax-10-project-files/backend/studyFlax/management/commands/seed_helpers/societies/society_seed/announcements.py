"""
Announcement seeding for society records.
"""

import random

from studyFlax.models import Society, SocietyAnnouncement, SocietyTag


ANNOUNCEMENT_TEMPLATES = [
    (
        "Welcome to {name}!",
        "We're excited to have you here. Stay tuned for upcoming events, workshops, and socials. "
        "Make sure to check our calendar regularly and feel free to reach out if you have any questions.",
        True,
    ),
    (
        "Upcoming Event This Week",
        "Don't miss our session this week! We have something exciting planned for all members. "
        "Details will be shared closer to the date — keep an eye on the announcements.",
        False,
    ),
    (
        "New Members Welcome",
        "A huge welcome to everyone who joined us recently. We're glad to have you as part of the community. "
        "Feel free to introduce yourself at our next meetup.",
        False,
    ),
    (
        "Reminder: Meeting Tonight",
        "Just a friendly reminder that we have a meeting tonight. Please come along and bring a friend! "
        "All skill levels are welcome and refreshments will be provided.",
        False,
    ),
    (
        "Photos from Last Session",
        "What an amazing session last time! Thank you to everyone who came along. "
        "We hope to see even more of you at the next one.",
        False,
    ),
    (
        "Season Schedule Released",
        "We've released the full schedule for this term. You can find all upcoming dates and events "
        "on our calendar tab. Make sure to mark the key dates in your diary!",
        False,
    ),
    (
        "Committee Applications Open",
        "Interested in helping run {name}? We're looking for enthusiastic committee members "
        "for the upcoming year. Applications are now open — details inside.",
        False,
    ),
    (
        "Join Our Group Chat",
        "Make sure you're in our group chat to stay up to date with last-minute changes and social plans. "
        "Send a message to any committee member to be added.",
        False,
    ),
]


def _pick_tag(society):
    tags = list(SocietyTag.objects.filter(society=society))
    return random.choice(tags) if tags else None


def _create_announcement(society, title, content, pinned):
    SocietyAnnouncement.objects.update_or_create(
        society=society,
        title=title,
        defaults={
            "content": content,
            "pinned": pinned,
            "tag": _pick_tag(society),
        },
    )


def create_society_announcements(stdout):
    del stdout
    for society in Society.objects.all():
        count = random.randint(2, 4)
        chosen = random.sample(ANNOUNCEMENT_TEMPLATES, min(count, len(ANNOUNCEMENT_TEMPLATES)))
        for title_template, content, pinned in chosen:
            title = title_template.format(name=society.name)
            _create_announcement(society, title, content, pinned)
