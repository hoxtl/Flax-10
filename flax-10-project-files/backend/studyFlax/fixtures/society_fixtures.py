"""
Fixture data and helper functions for seeding societies, events, and categories.
"""

import random
from datetime import datetime, timedelta
from django.utils import timezone

# Valid society categories (consolidated to 8)
VALID_CATEGORIES = [
    'sports', 'cultural', 'academic', 'arts',
    'social', 'religious', 'volunteering', 'media'
]

# Images per category, with gaming merged into social, music and dance into arts, and professional into academic
CATEGORY_IMAGES = {
    'sports': ['sports1.jpg', 'sports2.jpg'],
    'cultural': ['cultural1.jpg', 'cultural2.jpg'],
    'academic': ['academic1.jpg', 'academic2.jpg', 'professional1.jpg', 'professional2.jpg'],
    'arts': ['arts1.jpg', 'arts2.jpg', 'music1.jpg', 'music2.jpg', 'dance1.jpg', 'dance2.jpg'],
    'social': ['social1.jpg', 'social2.jpg', 'gaming1.jpg', 'gaming2.jpg'],
    'religious': ['religious1.jpg', 'religious2.jpg'],
    'volunteering': ['volunteering1.jpg', 'volunteering2.jpg'],
    'media': ['media1.jpg', 'media2.jpg'],
}

# Reusable event templates by category
# Format: (title, description, hour, duration_mins, recurrence, day_of_week)
# day_of_week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun (None for one-off)
EVENT_TEMPLATES = {
    'sports': [
        ('Weekly Training', 'Regular training session for all members.', 18, 90, 'weekly', 2),
        ('Match Day', 'Competitive match against another team.', 14, 120, None, 5),
        ('Fitness Session', 'Gym workout with the team.', 17, 60, 'weekly', 4),
        ('Social Drinks', 'Post-training drinks at the student bar.', 20, 120, None, None),
    ],
    'cultural': [
        ('Weekly Meeting', 'Regular society meetup and planning.', 18, 90, 'weekly', 3),
        ('Cultural Night', 'Celebrate our heritage with food and performances.', 19, 180, None, 5),
        ('Language Exchange', 'Practice languages with native speakers.', 17, 90, 'weekly', 1),
        ('Festival Celebration', 'Annual festival celebration event.', 18, 180, None, None),
    ],
    'academic': [
        ('Weekly Workshop', 'Skill-building workshop for members.', 17, 90, 'weekly', 2),
        ('Guest Speaker', 'Talk from an industry professional.', 18, 90, None, None),
        ('Study Group', 'Collaborative study session.', 14, 120, 'weekly', 5),
        ('Competition Prep', 'Prepare for upcoming competitions.', 16, 120, None, None),
    ],
    'arts': [
        ('Weekly Practice', 'Regular practice session.', 18, 120, 'weekly', 3),
        ('Exhibition Opening', 'Showcase member work.', 19, 120, None, 5),
        ('Workshop', 'Learn new techniques.', 14, 150, None, 5),
        ('Critique Session', 'Peer feedback on works in progress.', 17, 90, 'biweekly', 1),
    ],
    'social': [
        ('Weekly Social', 'Casual hangout for members.', 19, 120, 'weekly', 4),
        ('Games Night', 'Board games and fun.', 18, 180, 'biweekly', 3),
        ('Trip Planning', 'Plan upcoming society trips.', 17, 60, None, None),
        ('End of Term Party', 'Celebrate the end of term.', 20, 180, None, 5),
    ],
    'gaming': [
        ('Weekly Gaming', 'Regular gaming session.', 18, 180, 'weekly', 4),
        ('Tournament', 'Competitive tournament with prizes.', 14, 240, None, 5),
        ('Casual Play', 'Drop-in casual gaming.', 19, 120, 'weekly', 1),
        ('LAN Party', 'Bring your setup for a LAN event.', 12, 480, None, 5),
    ],
    'music': [
        ('Weekly Rehearsal', 'Regular practice session.', 18, 120, 'weekly', 2),
        ('Concert', 'End of term performance.', 19, 120, None, 5),
        ('Jam Session', 'Informal music making.', 17, 120, 'weekly', 4),
        ('Open Mic', 'Perform for fellow students.', 19, 150, None, 4),
    ],
    'dance': [
        ('Weekly Practice', 'Learn and practice choreography.', 18, 90, 'weekly', 2),
        ('Showcase', 'Performance showcase.', 19, 120, None, 5),
        ('Beginner Class', 'Introduction for new dancers.', 17, 60, 'weekly', 0),
        ('Social Dance', 'Practice with partners.', 19, 120, 'biweekly', 4),
    ],
    'religious': [
        ('Weekly Meeting', 'Regular gathering and discussion.', 18, 90, 'weekly', 3),
        ('Study Circle', 'Scripture study and reflection.', 17, 60, 'weekly', 1),
        ('Community Event', 'Open event for all students.', 14, 120, None, 5),
        ('Charity Drive', 'Fundraising for a good cause.', 10, 240, None, 5),
    ],
    'professional': [
        ('Weekly Workshop', 'Career skills development.', 18, 90, 'weekly', 2),
        ('Networking Event', 'Meet industry professionals.', 18, 150, None, 3),
        ('CV Workshop', 'Get feedback on your CV.', 14, 120, None, 5),
        ('Mock Interviews', 'Practice interview skills.', 17, 120, 'biweekly', 4),
    ],
    'volunteering': [
        ('Weekly Volunteering', 'Regular volunteering shift.', 10, 180, 'weekly', 5),
        ('Planning Meeting', 'Organise upcoming activities.', 18, 60, 'weekly', 1),
        ('Community Event', 'Special volunteering event.', 9, 240, None, 5),
        ('Fundraiser', 'Raise money for charity.', 12, 180, None, 5),
    ],
    'media': [
        ('Weekly Meeting', 'Editorial planning and updates.', 18, 90, 'weekly', 1),
        ('Production Day', 'Create content together.', 14, 180, 'weekly', 5),
        ('Training Session', 'Learn new skills.', 17, 90, None, 3),
        ('Live Event', 'Special live broadcast or screening.', 19, 120, None, 4),
    ],
}

def get_events_for_category(category):
    return EVENT_TEMPLATES.get(category, EVENT_TEMPLATES['social'])

# Society data with categories
# Format: (name, bio, about, category, tags)
SOCIETY_DATA = [
    # Sports (14)
    ('Football Club', 'The beautiful game at KCL.', 'Weekly training and matches.', 'sports', ['Training', 'Match', 'Social']),
    ('Basketball Society', 'Hoops for all skill levels.', 'Casual and competitive basketball.', 'sports', ['Training', 'Tournament', 'Social']),
    ('Tennis Club', 'Serve, volley, and have fun.', 'Sessions for all levels.', 'sports', ['Training', 'Match', 'Social']),
    ('Yoga Society', 'Mind, body, and breath.', 'Weekly yoga sessions.', 'sports', ['Class', 'Workshop', 'Social']),
    ('Hiking Society', 'Explore the outdoors.', 'Regular hikes and trips.', 'sports', ['Hike', 'Trip', 'Social']),
    ('Swimming Club', 'Make a splash.', 'Pool sessions and competitions.', 'sports', ['Training', 'Competition', 'Social']),
    ('Rugby Club', 'Try something new.', 'Training for all experience levels.', 'sports', ['Training', 'Match', 'Social']),
    ('Badminton Society', 'Shuttlecock and smash.', 'Weekly sessions for all levels.', 'sports', ['Training', 'Tournament', 'Social']),
    ('Volleyball Club', 'Spike and serve.', 'Beach and indoor volleyball.', 'sports', ['Training', 'Match', 'Social']),
    ('Cricket Society', 'Bat and ball at KCL.', 'Training and matches.', 'sports', ['Training', 'Match', 'Social']),
    ('Boxing Club', 'Train like a champion.', 'Fitness and technique sessions.', 'sports', ['Training', 'Fitness', 'Social']),
    ('Cycling Society', 'Two wheels, endless roads.', 'Group rides and tours.', 'sports', ['Ride', 'Trip', 'Social']),
    ('Climbing Club', 'Reach new heights.', 'Indoor and outdoor climbing.', 'sports', ['Training', 'Trip', 'Social']),
    ('Athletics Club', 'Track and field.', 'Running, jumping, throwing.', 'sports', ['Training', 'Competition', 'Social']),

    # Cultural (10)
    ('Chinese Society', 'Celebrating Chinese culture.', 'Events and language exchange.', 'cultural', ['Cultural', 'Social', 'Festival']),
    ('African Caribbean Society', 'Celebrating heritage.', 'Cultural events and discussions.', 'cultural', ['Cultural', 'Social', 'Performance']),
    ('Indian Society', 'Indian culture and traditions.', 'Diwali, Bollywood nights, and more.', 'cultural', ['Cultural', 'Festival', 'Social']),
    ('Korean Society', 'Korean culture at KCL.', 'K-culture events and socials.', 'cultural', ['Cultural', 'Social', 'Festival']),
    ('Latin American Society', 'Celebrating Latin culture.', 'Dance, food, and music.', 'cultural', ['Cultural', 'Social', 'Performance']),
    ('Japanese Society', 'Japanese culture and language.', 'Anime, food, and traditions.', 'cultural', ['Cultural', 'Social', 'Festival']),
    ('Middle Eastern Society', 'Celebrating Middle Eastern heritage.', 'Food, music, and culture.', 'cultural', ['Cultural', 'Social', 'Performance']),
    ('European Society', 'European cultures united.', 'Exchange and celebration.', 'cultural', ['Cultural', 'Social', 'Festival']),
    ('South Asian Society', 'South Asian heritage.', 'Festivals and community.', 'cultural', ['Cultural', 'Festival', 'Social']),
    ('Southeast Asian Society', 'Southeast Asian culture.', 'Food and traditions.', 'cultural', ['Cultural', 'Social', 'Festival']),

    # Academic (10)
    ('Tech Society', 'Technology and innovation.', 'Hackathons and workshops.', 'academic', ['Workshop', 'Hackathon', 'Networking']),
    ('Literature Society', 'Exploring books.', 'Book club and writing workshops.', 'academic', ['Book Club', 'Workshop', 'Reading']),
    ('Debate Society', 'Argue with style.', 'Weekly debates and competitions.', 'academic', ['Debate', 'Workshop', 'Competition']),
    ('MedSoc', 'Medical students society.', 'Academic and social events.', 'academic', ['Workshop', 'Social', 'Networking']),
    ('Engineering Society', 'Building the future.', 'Projects and industry talks.', 'academic', ['Workshop', 'Project', 'Networking']),
    ('Physics Society', 'Exploring the universe.', 'Lectures and stargazing.', 'academic', ['Lecture', 'Workshop', 'Social']),
    ('Chemistry Society', 'Molecules and reactions.', 'Lab demos and events.', 'academic', ['Workshop', 'Demo', 'Social']),
    ('Biology Society', 'Life sciences at KCL.', 'Field trips and talks.', 'academic', ['Trip', 'Lecture', 'Social']),
    ('Psychology Society', 'Understanding the mind.', 'Talks and research events.', 'academic', ['Lecture', 'Workshop', 'Social']),
    ('History Society', 'Learning from the past.', 'Talks and museum trips.', 'academic', ['Lecture', 'Trip', 'Social']),

    # Arts (8)
    ('Art Club', 'Creative expression.', 'Art projects and exhibitions.', 'arts', ['Exhibition', 'Workshop', 'Social']),
    ('Photography Society', 'Through the lens.', 'Photo walks and exhibitions.', 'arts', ['Photo Walk', 'Exhibition', 'Workshop']),
    ('Drama Society', 'Theatre and performance.', 'Produce plays and shows.', 'arts', ['Rehearsal', 'Performance', 'Social']),
    ('Painting Society', 'Colours on canvas.', 'Painting sessions and exhibitions.', 'arts', ['Workshop', 'Exhibition', 'Social']),
    ('Sculpture Club', '3D art creation.', 'Sculpting workshops.', 'arts', ['Workshop', 'Exhibition', 'Social']),
    ('Digital Art Society', 'Art meets technology.', 'Digital creation workshops.', 'arts', ['Workshop', 'Exhibition', 'Social']),
    ('Fashion Society', 'Style and design.', 'Fashion shows and workshops.', 'arts', ['Show', 'Workshop', 'Social']),
    ('Creative Writing Society', 'Words and stories.', 'Writing workshops and readings.', 'arts', ['Workshop', 'Reading', 'Social']),

    # Gaming (8)
    ('Board Game Society', 'Fun and games.', 'Weekly game nights.', 'gaming', ['Game Night', 'Tournament', 'Social']),
    ('Esports Society', 'Competitive gaming.', 'Tournaments and teams.', 'gaming', ['Tournament', 'Social', 'Training']),
    ('Chess Club', 'Strategic thinking.', 'Learn and compete.', 'gaming', ['Tournament', 'Training', 'Social']),
    ('Poker Society', 'Cards and strategy.', 'Poker nights and tournaments.', 'gaming', ['Game Night', 'Tournament', 'Social']),
    ('Trading Card Society', 'Collect and compete.', 'TCG tournaments and trading.', 'gaming', ['Tournament', 'Trading', 'Social']),
    ('RPG Society', 'Role-playing adventures.', 'D&D and more.', 'gaming', ['Campaign', 'Social', 'Workshop']),
    ('Puzzle Society', 'Brain teasers and challenges.', 'Puzzle solving events.', 'gaming', ['Competition', 'Social', 'Workshop']),
    ('Retro Gaming Club', 'Classic games revived.', 'Retro gaming sessions.', 'gaming', ['Game Night', 'Social', 'Tournament']),

    # Music (8)
    ('A Cappella Group', 'Vocal harmony.', 'Arrange and perform.', 'music', ['Rehearsal', 'Performance', 'Social']),
    ('Jazz Band', 'Swing and bebop.', 'Jam sessions and gigs.', 'music', ['Jam Session', 'Performance', 'Workshop']),
    ('Orchestra', 'Classical music.', 'Rehearsals and concerts.', 'music', ['Rehearsal', 'Concert', 'Social']),
    ('DJ Society', 'Beats and mixing.', 'Learn to DJ and perform.', 'music', ['Workshop', 'Performance', 'Social']),
    ('Rock Band Society', 'Rock and roll.', 'Band sessions and gigs.', 'music', ['Rehearsal', 'Performance', 'Social']),
    ('Choir', 'Singing together.', 'Choral performances.', 'music', ['Rehearsal', 'Concert', 'Social']),
    ('Guitar Society', 'Six strings of fun.', 'Learn and jam.', 'music', ['Workshop', 'Jam Session', 'Social']),
    ('Electronic Music Society', 'Beats and synths.', 'Production workshops.', 'music', ['Workshop', 'Performance', 'Social']),

    # Dance (4)
    ('K-Pop Dance Society', 'K-Pop choreography.', 'Learn the latest moves.', 'dance', ['Practice', 'Performance', 'Social']),
    ('Salsa Society', 'Latin dance.', 'Salsa and bachata.', 'dance', ['Beginner', 'Social', 'Workshop']),
    ('Hip Hop Dance', 'Street dance.', 'Classes and battles.', 'dance', ['Practice', 'Battle', 'Social']),
    ('Ballroom Dancing', 'Elegant partner dance.', 'Learn classic dances.', 'dance', ['Class', 'Social', 'Competition']),

    # Religious (4)
    ('Islamic Society', 'Faith and community.', 'Prayer and events.', 'religious', ['Lecture', 'Social', 'Community']),
    ('Christian Union', 'Faith and fellowship.', 'Meetings and outreach.', 'religious', ['Meeting', 'Study', 'Social']),
    ('Hindu Society', 'Hindu traditions.', 'Festivals and gatherings.', 'religious', ['Cultural', 'Festival', 'Social']),

    # Social (10)
    ('Comedy Society', 'Laughs and good times.', 'Stand-up and improv.', 'social', ['Open Mic', 'Workshop', 'Social']),
    ('Wine Society', 'Fine wines.', 'Tastings and trips.', 'social', ['Tasting', 'Social', 'Trip']),
    ('Cooking Society', 'Culinary adventures.', 'Cook and eat together.', 'social', ['Workshop', 'Social', 'Tasting']),
    ('Coffee Society', 'Coffee appreciation.', 'Tastings and cafe trips.', 'social', ['Tasting', 'Social', 'Trip']),
    ('Tea Society', 'Tea appreciation.', 'Tastings and ceremonies.', 'social', ['Tasting', 'Social', 'Workshop']),
    ('Baking Society', 'Sweet treats.', 'Bake sales and workshops.', 'social', ['Workshop', 'Social', 'Bake Sale']),
    ('Travel Society', 'Explore the world.', 'Trip planning and adventures.', 'social', ['Trip', 'Social', 'Planning']),
    ('Book Club', 'Reading together.', 'Monthly book discussions.', 'social', ['Discussion', 'Social', 'Reading']),
    ('Quiz Society', 'Test your knowledge.', 'Weekly pub quizzes.', 'social', ['Quiz', 'Social', 'Competition']),
    ('Networking Society', 'Make connections.', 'Networking events.', 'social', ['Networking', 'Social', 'Workshop']),

    # Professional (8)
    ('Investment Society', 'Markets and trading.', 'Workshops and competitions.', 'professional', ['Workshop', 'Competition', 'Networking']),
    ('Law Society', 'For future lawyers.', 'Mooting and networking.', 'professional', ['Mooting', 'Networking', 'Workshop']),
    ('Consulting Society', 'Business strategy.', 'Case competitions and talks.', 'professional', ['Competition', 'Workshop', 'Networking']),
    ('Entrepreneurship Society', 'Start something new.', 'Pitch events and mentorship.', 'professional', ['Pitch', 'Workshop', 'Networking']),
    ('Marketing Society', 'Brand and promote.', 'Marketing workshops and events.', 'professional', ['Workshop', 'Competition', 'Networking']),
    ('Finance Society', 'Money matters.', 'Industry talks and workshops.', 'professional', ['Workshop', 'Networking', 'Competition']),
    ('Data Science Society', 'Insights from data.', 'Workshops and projects.', 'professional', ['Workshop', 'Project', 'Networking']),
    ('Product Management Society', 'Building products.', 'PM workshops and case studies.', 'professional', ['Workshop', 'Case Study', 'Networking']),

    # Volunteering (8)
    ('Volunteering Society', 'Give back.', 'Regular volunteering.', 'volunteering', ['Volunteering', 'Social', 'Community']),
    ('Environmental Society', 'Sustainability.', 'Climate action and campaigns.', 'volunteering', ['Campaign', 'Workshop', 'Social']),
    ('RAG Society', 'Raise and Give.', 'Charity fundraising.', 'volunteering', ['Fundraiser', 'Social', 'Community']),
    ('Tutoring Society', 'Help others learn.', 'Peer tutoring sessions.', 'volunteering', ['Tutoring', 'Social', 'Community']),
    ('Homeless Outreach Society', 'Supporting the homeless.', 'Outreach and fundraising.', 'volunteering', ['Outreach', 'Fundraiser', 'Community']),
    ('Animal Welfare Society', 'Helping animals.', 'Shelter visits and fundraising.', 'volunteering', ['Volunteering', 'Fundraiser', 'Social']),
    ('Refugee Support Society', 'Supporting refugees.', 'Language help and integration.', 'volunteering', ['Volunteering', 'Community', 'Social']),
    ('Mental Health Society', 'Wellbeing awareness.', 'Campaigns and support.', 'volunteering', ['Campaign', 'Workshop', 'Community']),

    # Media (8)
    ('Film Society', 'Cinema lovers.', 'Screenings and filmmaking.', 'media', ['Screening', 'Workshop', 'Social']),
    ('Radio Society', 'Student radio.', 'Run shows and broadcast.', 'media', ['Show', 'Workshop', 'Social']),
    ('Newspaper Society', 'Student journalism.', 'Write and report.', 'media', ['Meeting', 'Workshop', 'Social']),
    ('Podcast Society', 'Audio storytelling.', 'Create and share podcasts.', 'media', ['Recording', 'Workshop', 'Social']),
    ('TV Society', 'Student television.', 'Produce shows and content.', 'media', ['Production', 'Workshop', 'Social']),
    ('Documentary Society', 'Real stories.', 'Documentary screenings and making.', 'media', ['Screening', 'Production', 'Social']),
    ('Animation Society', 'Bring drawings to life.', 'Animation workshops.', 'media', ['Workshop', 'Production', 'Social']),
    ('Social Media Society', 'Digital content.', 'Content creation workshops.', 'media', ['Workshop', 'Social', 'Production']),
]

def build_society_seed_data():
    result = []
    for name, bio, about, category, tags in SOCIETY_DATA:
        society = build_society_dict(name, bio, about, category, tags)
        result.append(society)
    return result

# Map old categories to consolidated ones
CATEGORY_MAPPING = {
    'gaming': 'social', 'music': 'arts', 'dance': 'arts', 'professional': 'academic'
}

ABOUT_OPENERS = {
    'sports': "{name} gives students a regular way to stay active, build confidence, and meet teammates outside their course.",
    'cultural': "{name} is a welcoming community for students who want to celebrate culture, share traditions, and feel at home on campus.",
    'academic': "{name} brings together curious students who want to take ideas beyond lectures and into practical conversations, projects, and skill-building.",
    'arts': "{name} is built for students who enjoy making, performing, and sharing creative work in a supportive setting.",
    'gaming': "{name} is a relaxed place to play, compete, and make friends through regular sessions that balance fun with a little healthy rivalry.",
    'music': "{name} gives musicians and music lovers a place to rehearse, perform, and grow their confidence throughout the year.",
    'dance': "{name} is a friendly way to move, learn new routines, and build confidence through regular practice and performance opportunities.",
    'religious': "{name} offers a steady sense of community for reflection, support, and shared faith during the busyness of university life.",
    'social': "{name} is designed to make campus feel smaller, with easy entry points for new members and a social calendar that stays approachable.",
    'professional': "{name} helps students build confidence beyond the classroom through practical workshops, peer support, and industry-facing events.",
    'volunteering': "{name} combines community action with a strong social core, giving members meaningful ways to contribute while meeting people who care about the same issues.",
    'media': "{name} is for students who want to make things people can actually watch, hear, read, or share, with room to learn new production skills as you go.",
}

ABOUT_CLOSERS = {
    'sports': "Expect a mix of coached sessions, friendly competition, and post-event socials that make it easy to get to know people.",
    'cultural': "Across the term, the society mixes celebration, conversation, and shared experiences so both new and returning members can take part comfortably.",
    'academic': "Members can drop in for one event, or get more involved over time through committee work, collaborations, and bigger showcase moments.",
    'arts': "There is space for complete beginners as well as experienced members, so joining feels just as natural for trying something new as it does for sharpening your craft.",
    'gaming': "Whether you are there for tournaments or low-pressure hangouts, the atmosphere is meant to stay inclusive, social, and easy to join mid-term.",
    'music': "From informal rehearsals to bigger showcase moments, the society aims to make creative progress feel collaborative rather than intimidating.",
    'dance': "Beginners are still able to join in, and regular members get chances to refine technique, perform, and help shape the group's energy.",
    'religious': "Regular gatherings are paired with wider community events, giving members both familiar routines and open opportunities to connect with others.",
    'social': "Most events are intentionally low-pressure, so you can come along casually, bring a friend, and get involved without already knowing anyone.",
    'professional': "It works well for students who want career momentum without losing the friendly, student-led feel that makes societies enjoyable.",
    'volunteering': "The goal is to make giving back feel practical, consistent, and genuinely social rather than like another isolated commitment.",
    'media': "Members usually learn by making, so projects are hands-on and collaborative from the start instead of feeling closed off to newcomers.",
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
    focus = _normalise_phrase(about) or _normalise_phrase(bio) or "shared interests"
    tag_copy = _join_tags(tags)
    first = ABOUT_OPENERS.get(category, ABOUT_OPENERS['social']).format(name=name)
    second = f"Typical weeks revolve around {focus}"
    if tag_copy:
        second += f", with members often joining for {tag_copy.lower()}"
    second += "."
    third = ABOUT_CLOSERS.get(category, ABOUT_CLOSERS['social'])
    return f"{first} {second}\n\n{third}"

def build_society_dict(name, bio, about, category, tags):
    image = get_random_category_image(category)
    mapped_category = CATEGORY_MAPPING.get(category, category)
    return {
        'name': name, 'bio': bio, 'about': build_rich_about(name, bio, about, category, tags),
        'categories': [mapped_category], 'tags': tags,
        'events': get_events_for_category(category),
        'image': f'http://localhost:8000/static/seed_images/societies/{image}',
    }

def get_random_category_image(category):
    mapped = CATEGORY_MAPPING.get(category, category)
    images = CATEGORY_IMAGES.get(mapped, CATEGORY_IMAGES['social'])
    original_prefix = f'{category}' if category != mapped else None
    original_images = [img for img in images if img.startswith(original_prefix)] if original_prefix else []
    return random.choice(original_images or images)

def build_event_datetime(hour, duration_mins, day_of_week=None):
    base_date = get_next_occurrence(day_of_week)
    start = timezone.make_aware(datetime.combine(base_date, datetime.min.time().replace(hour=hour)))
    end = start + timedelta(minutes=duration_mins)
    return start, end

def get_next_occurrence(day_of_week):
    """Get the next date for a given day of week (0=Mon, 6=Sun)."""

    today = timezone.now().date()
    if day_of_week is None:
        return today + timedelta(days=7)
    days_ahead = day_of_week - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)
