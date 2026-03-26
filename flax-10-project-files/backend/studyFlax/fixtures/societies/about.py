"""
Copy helpers for seeded society descriptions.
"""

ABOUT_OPENERS = {
    "sports": "{name} gives students a regular way to stay active, build confidence, and meet team-mates outside their course.",
    "cultural": "{name} is a welcoming community for students who want to celebrate culture, share traditions, and feel at home on campus.",
    "academic": "{name} brings together curious students who want to take ideas beyond lectures and into practical conversations, projects, and skill-building.",
    "arts": "{name} is built for students who enjoy making, performing, and sharing creative work in a supportive setting.",
    "gaming": "{name} is a relaxed place to play, compete, and make friends through regular sessions that balance fun with a little healthy rivalry.",
    "music": "{name} gives musicians and music lovers a place to rehearse, perform, and grow their confidence throughout the year.",
    "dance": "{name} is a friendly way to move, learn new routines, and build confidence through regular practice and performance opportunities.",
    "religious": "{name} offers a steady sense of community for reflection, support, and shared faith during the busyness of university life.",
    "social": "{name} is designed to make campus feel smaller, with easy entry points for new members and a social calendar that stays approachable.",
    "professional": "{name} helps students build confidence beyond the classroom through practical workshops, peer support, and industry-facing events.",
    "volunteering": "{name} combines community action with a strong social core, giving members meaningful ways to contribute while meeting people who care about the same issues.",
    "media": "{name} is for students who want to make things people can actually watch, hear, read, or share, with room to learn new production skills as you go.",
}

ABOUT_CLOSERS = {
    "sports": "Expect a mix of coached sessions, friendly competition, and post-event socials that make it easy to get to know people.",
    "cultural": "Across the term, the society mixes celebration, conversation, and shared experiences so both new and returning members can take part comfortably.",
    "academic": "Members can drop in for one event, or get more involved over time through committee work, collaborations, and bigger showcase moments.",
    "arts": "There is space for complete beginners as well as experienced members, so joining feels just as natural for trying something new as it does for sharpening your craft.",
    "gaming": "Whether you are there for tournaments or low-pressure hangouts, the atmosphere is meant to stay inclusive, social, and easy to join mid-term.",
    "music": "From informal rehearsals to bigger showcase moments, the society aims to make creative progress feel collaborative rather than intimidating.",
    "dance": "Beginners are still able to join in, and regular members get chances to refine technique, perform, and help shape the group's energy.",
    "religious": "Regular gatherings are paired with wider community events, giving members both familiar routines and open opportunities to connect with others.",
    "social": "Most events are intentionally low-pressure, so you can come along casually, bring a friend, and get involved without already knowing anyone.",
    "professional": "It works well for students who want career momentum without losing the friendly, student-led feel that makes societies enjoyable.",
    "volunteering": "The goal is to make giving back feel practical, consistent, and genuinely social rather than like another isolated commitment.",
    "media": "Members usually learn by making, so projects are hands-on and collaborative from the start instead of feeling closed off to newcomers.",
}


def _normalise_phrase(text):
    phrase = str(text or "").strip().rstrip(".")
    if not phrase:
        return ""
    return phrase[0].lower() + phrase[1:]


def _join_tags(tags):
    cleaned = [str(tag).strip() for tag in (tags or []) if str(tag).strip()]
    if not cleaned:
        return ""
    if len(cleaned) == 1:
        return cleaned[0]
    if len(cleaned) == 2:
        return f"{cleaned[0]} and {cleaned[1]}"
    return f"{', '.join(cleaned[:-1])}, and {cleaned[-1]}"


def build_rich_about(name, bio, about, category, tags):
    """Build the long-form society description used during seeding."""

    focus = _normalise_phrase(about) or _normalise_phrase(bio) or "shared interests"
    tag_copy = _join_tags(tags)
    first = ABOUT_OPENERS.get(category, ABOUT_OPENERS["social"]).format(name=name)
    second = f"Typical weeks revolve around {focus}"
    if tag_copy:
        second += f", with members often joining for {tag_copy.lower()}"
    second += "."
    third = ABOUT_CLOSERS.get(category, ABOUT_CLOSERS["social"])
    return f"{first} {second}\n\n{third}"


__all__ = ["_join_tags", "_normalise_phrase", "build_rich_about"]

