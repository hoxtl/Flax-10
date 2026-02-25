# Society seed data with related events and images
SOCIETY_SEED_DATA = [
    {
        'name': 'Tech Society',
        'bio': 'Passionate about technology and innovation.',
        'about': 'We host hackathons, workshops, and networking events for tech enthusiasts.',
        'image': 'seed_images/societies/tech.jpg',
        'tags': ['Workshop', 'Hackathon', 'Networking'],
        'events': [
            {'title': 'Intro to Web Dev Workshop', 'description': 'Learn HTML, CSS and JavaScript basics.'},
            {'title': 'AI & Machine Learning Talk', 'description': 'Guest speaker from Google.'},
            {'title': 'Spring Hackathon', 'description': '24-hour coding competition with prizes.'},
            {'title': 'Tech Careers Panel', 'description': 'Q&A with industry professionals.'},
        ],
    },
    {
        'name': 'Art Club',
        'bio': 'Creative expression through various mediums.',
        'about': 'A community for artists to share ideas and work on collaborative projects.',
        'image': 'seed_images/societies/art.jpg',
        'tags': ['Exhibition', 'Workshop', 'Social'],
        'events': [
            {'title': 'Life Drawing Session', 'description': 'Sketch from live models.'},
            {'title': 'Watercolour Workshop', 'description': 'Learn watercolour techniques.'},
            {'title': 'End of Term Exhibition', 'description': 'Showcase your work.'},
            {'title': 'Museum Trip', 'description': 'Group visit to Tate Modern.'},
        ],
    },
    {
        'name': 'Photography Society',
        'bio': 'Capturing moments through the lens.',
        'about': 'Weekly photo walks and exhibitions to showcase student photography.',
        'image': 'seed_images/societies/photography.jpg',
        'tags': ['Photo Walk', 'Exhibition', 'Workshop'],
        'events': [
            {'title': 'Golden Hour Photo Walk', 'description': 'Sunset shoot at South Bank.'},
            {'title': 'Portrait Photography Workshop', 'description': 'Studio lighting basics.'},
            {'title': 'Street Photography Meetup', 'description': 'Explore Shoreditch with cameras.'},
            {'title': 'Photo Exhibition Opening', 'description': 'Display your best shots.'},
        ],
    },
    {
        'name': 'Board Game Society',
        'bio': 'Fun and games for everyone.',
        'about': 'Join us for weekly board game nights and tournaments.',
        'image': 'seed_images/societies/boardgames.jpg',
        'tags': ['Game Night', 'Tournament', 'Social'],
        'events': [
            {'title': 'Weekly Game Night', 'description': 'Catan, Ticket to Ride and more.'},
            {'title': 'Chess Tournament', 'description': 'Compete for the champion title.'},
            {'title': 'Learn to Play D&D', 'description': 'Intro session for beginners.'},
            {'title': 'Strategy Games Marathon', 'description': 'All-day gaming session.'},
        ],
    },
    {
        'name': 'Literature Society',
        'bio': 'Exploring the world through books.',
        'about': 'Book club discussions and writing workshops for literature lovers.',
        'image': 'seed_images/societies/literature.jpg',
        'tags': ['Book Club', 'Workshop', 'Reading'],
        'events': [
            {'title': 'Monthly Book Club', 'description': 'Discussing this month\'s pick.'},
            {'title': 'Creative Writing Workshop', 'description': 'Develop your writing skills.'},
            {'title': 'Poetry Open Mic', 'description': 'Share your poems or just listen.'},
            {'title': 'Author Talk', 'description': 'Guest speaker and book signing.'},
        ],
    },
]


def get_society_base_data():
    """Returns (name, bio, about, image) tuples for backward compatibility."""
    return tuple(
        (s['name'], s['bio'], s['about'], s['image'])
        for s in SOCIETY_SEED_DATA
    )
