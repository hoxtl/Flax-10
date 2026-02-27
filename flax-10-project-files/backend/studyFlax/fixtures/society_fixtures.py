from datetime import datetime, timedelta
from django.utils import timezone


# Society category choices
SOCIETY_CATEGORIES = [
    'sports', 'cultural', 'academic', 'arts', 'social',
    'gaming', 'music', 'dance', 'religious', 'professional',
    'volunteering', 'media'
]

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
    """Get event templates for a society category."""
    return EVENT_TEMPLATES.get(category, EVENT_TEMPLATES['social'])


# Society data with categories
# Format: (name, bio, about, category, image_name, tags)
SOCIETY_DATA = [
    # Sports
    ('Football Club', 'The beautiful game at KCL.', 'Weekly training and matches.', 'sports', None, ['Training', 'Match', 'Social']),
    ('Basketball Society', 'Hoops for all skill levels.', 'Casual and competitive basketball.', 'sports', None, ['Training', 'Tournament', 'Social']),
    ('Tennis Club', 'Serve, volley, and have fun.', 'Sessions for all levels.', 'sports', None, ['Training', 'Match', 'Social']),
    ('Yoga Society', 'Mind, body, and breath.', 'Weekly yoga sessions.', 'sports', None, ['Class', 'Workshop', 'Social']),
    ('Hiking Society', 'Explore the outdoors.', 'Regular hikes and trips.', 'sports', None, ['Hike', 'Trip', 'Social']),
    ('Swimming Club', 'Make a splash.', 'Pool sessions and competitions.', 'sports', None, ['Training', 'Competition', 'Social']),
    ('Rugby Club', 'Try something new.', 'Training for all experience levels.', 'sports', None, ['Training', 'Match', 'Social']),

    # Cultural
    ('Chinese Society', 'Celebrating Chinese culture.', 'Events and language exchange.', 'cultural', None, ['Cultural', 'Social', 'Festival']),
    ('African Caribbean Society', 'Celebrating heritage.', 'Cultural events and discussions.', 'cultural', None, ['Cultural', 'Social', 'Performance']),
    ('Indian Society', 'Indian culture and traditions.', 'Diwali, Bollywood nights, and more.', 'cultural', None, ['Cultural', 'Festival', 'Social']),
    ('Korean Society', 'Korean culture at KCL.', 'K-culture events and socials.', 'cultural', None, ['Cultural', 'Social', 'Festival']),
    ('Latin American Society', 'Celebrating Latin culture.', 'Dance, food, and music.', 'cultural', None, ['Cultural', 'Social', 'Performance']),

    # Academic
    ('Tech Society', 'Technology and innovation.', 'Hackathons and workshops.', 'academic', 'tech.jpg', ['Workshop', 'Hackathon', 'Networking']),
    ('Literature Society', 'Exploring books.', 'Book club and writing workshops.', 'academic', 'literature.jpg', ['Book Club', 'Workshop', 'Reading']),
    ('Debate Society', 'Argue with style.', 'Weekly debates and competitions.', 'academic', None, ['Debate', 'Workshop', 'Competition']),
    ('Investment Society', 'Markets and trading.', 'Workshops and competitions.', 'professional', None, ['Workshop', 'Competition', 'Networking']),
    ('Law Society', 'For future lawyers.', 'Mooting and networking.', 'professional', None, ['Mooting', 'Networking', 'Workshop']),
    ('MedSoc', 'Medical students society.', 'Academic and social events.', 'academic', None, ['Workshop', 'Social', 'Networking']),

    # Arts
    ('Art Club', 'Creative expression.', 'Art projects and exhibitions.', 'arts', 'art.jpg', ['Exhibition', 'Workshop', 'Social']),
    ('Photography Society', 'Through the lens.', 'Photo walks and exhibitions.', 'arts', 'photography.jpg', ['Photo Walk', 'Exhibition', 'Workshop']),
    ('Drama Society', 'Theatre and performance.', 'Produce plays and shows.', 'arts', None, ['Rehearsal', 'Performance', 'Social']),
    ('Film Society', 'Cinema lovers.', 'Screenings and filmmaking.', 'media', None, ['Screening', 'Workshop', 'Social']),

    # Gaming
    ('Board Game Society', 'Fun and games.', 'Weekly game nights.', 'gaming', 'boardgames.jpg', ['Game Night', 'Tournament', 'Social']),
    ('Esports Society', 'Competitive gaming.', 'Tournaments and teams.', 'gaming', None, ['Tournament', 'Social', 'Training']),
    ('Chess Club', 'Strategic thinking.', 'Learn and compete.', 'gaming', None, ['Tournament', 'Training', 'Social']),

    # Music
    ('A Cappella Group', 'Vocal harmony.', 'Arrange and perform.', 'music', None, ['Rehearsal', 'Performance', 'Social']),
    ('Jazz Band', 'Swing and bebop.', 'Jam sessions and gigs.', 'music', None, ['Jam Session', 'Performance', 'Workshop']),
    ('Orchestra', 'Classical music.', 'Rehearsals and concerts.', 'music', None, ['Rehearsal', 'Concert', 'Social']),
    ('DJ Society', 'Beats and mixing.', 'Learn to DJ and perform.', 'music', None, ['Workshop', 'Performance', 'Social']),

    # Dance
    ('K-Pop Dance Society', 'K-Pop choreography.', 'Learn the latest moves.', 'dance', None, ['Practice', 'Performance', 'Social']),
    ('Salsa Society', 'Latin dance.', 'Salsa and bachata.', 'dance', None, ['Beginner', 'Social', 'Workshop']),
    ('Hip Hop Dance', 'Street dance.', 'Classes and battles.', 'dance', None, ['Practice', 'Battle', 'Social']),
    ('Ballroom Dancing', 'Elegant partner dance.', 'Learn classic dances.', 'dance', None, ['Class', 'Social', 'Competition']),

    # Religious
    ('Islamic Society', 'Faith and community.', 'Prayer and events.', 'religious', None, ['Lecture', 'Social', 'Community']),
    ('Christian Union', 'Faith and fellowship.', 'Meetings and outreach.', 'religious', None, ['Meeting', 'Study', 'Social']),
    ('Jewish Society', 'Jewish life at KCL.', 'Cultural and religious events.', 'religious', None, ['Cultural', 'Social', 'Festival']),
    ('Hindu Society', 'Hindu traditions.', 'Festivals and gatherings.', 'religious', None, ['Cultural', 'Festival', 'Social']),

    # Social
    ('Comedy Society', 'Laughs and good times.', 'Stand-up and improv.', 'social', None, ['Open Mic', 'Workshop', 'Social']),
    ('Wine Society', 'Fine wines.', 'Tastings and trips.', 'social', None, ['Tasting', 'Social', 'Trip']),
    ('Cooking Society', 'Culinary adventures.', 'Cook and eat together.', 'social', None, ['Workshop', 'Social', 'Tasting']),
    ('Coffee Society', 'Coffee appreciation.', 'Tastings and cafe trips.', 'social', None, ['Tasting', 'Social', 'Trip']),

    # Volunteering
    ('Volunteering Society', 'Give back.', 'Regular volunteering.', 'volunteering', None, ['Volunteering', 'Social', 'Community']),
    ('Environmental Society', 'Sustainability.', 'Climate action and campaigns.', 'volunteering', None, ['Campaign', 'Workshop', 'Social']),
    ('RAG Society', 'Raise and Give.', 'Charity fundraising.', 'volunteering', None, ['Fundraiser', 'Social', 'Community']),

    # Media
    ('Radio Society', 'Student radio.', 'Run shows and broadcast.', 'media', None, ['Show', 'Workshop', 'Social']),
    ('Newspaper Society', 'Student journalism.', 'Write and report.', 'media', None, ['Meeting', 'Workshop', 'Social']),
    ('Podcast Society', 'Audio storytelling.', 'Create and share podcasts.', 'media', None, ['Recording', 'Workshop', 'Social']),
]


def build_society_seed_data():
    """Build society seed data from the structured format."""
    result = []
    for name, bio, about, category, image, tags in SOCIETY_DATA:
        society = build_society_dict(name, bio, about, category, image, tags)
        result.append(society)
    return result


def build_society_dict(name, bio, about, category, image, tags):
    """Build a single society dictionary."""
    society = {
        'name': name, 'bio': bio, 'about': about,
        'category': category, 'tags': tags,
        'events': get_events_for_category(category),
    }
    if image:
        society['image'] = f'http://localhost:8000/static/seed_images/societies/{image}'
    return society


def build_event_datetime(hour, duration_mins, day_of_week=None):
    """Build start and end datetime for an event."""
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
