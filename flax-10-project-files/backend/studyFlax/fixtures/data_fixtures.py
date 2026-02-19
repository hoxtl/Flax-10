# Format: (name, color, is_default)
category_fixtures = (
    ('Work', '#FF5733', True),
    ('University', '#33FF57', True),
    ('Personal', '#3357FF', True),
    ('Chores', '#FF33A8', False),
    ('Social', '#A833FF', False),
    ('Health', '#33FFF5', False),
)

# Format: (name, default_duration_minutes)
tag_fixtures = (
    ('Lecture', 120),
    ('Practical', 90),
    ('Study Session', 120),
    ('Meeting', 30),
    ('Gym', 60),
    ('Grocery Shopping', 45),
    ('Assignment Deadline', 0),
)

# Format: (frequency, interval)
recurrence_fixtures = (
    ('daily', 1),
    ('weekly', 1),
    ('weekly', 2),
    ('monthly', 1),
)

event_title_fixtures = (
    "Lidl Run", "Tesco Express at Midnight", "Meal Prep Sunday",
    "Coffee with Mum at Costa", "Dinner at Grandma's",
    "Brunch with the Girls", "Drinks with Flatmates",
    "Sam's Birthday Pres", "Movie Night with Housemates",
    "FaceTime with Home", "Prep for seminar",
    "Morning Run before 9am", "Gym with Jake",
    "Yoga before Lectures", "Internship Application Deadline", 
    "Spring Week Interview", "CV Drop-in Session", "Email my Tutor",
    "Sort out Student Finance", "Pay Rent",
    "Renew Railcard", "Book Dentist",
    "GP Appointment", "Laundry (overdue)", "Deep Clean the Kitchen",
    "IKEA Trip with Mia", "Inpost parcel return", "Group project meeting",
    "Do mock exam", "Review notes",

    # KCL specific
    "Study at Maughan Library", "Bush House Lab Session", "King's Sport Gym Session",
    "KCLSU Basketball Event", "Revision at FWB with friends", "Somerset House Visit",
    "KCL Careers Fair Prep", "King's Volunteering Shift",
    "KEATS Coursework Submission", "Denmark Hill Placement", "St Thomas Hospital Visit",
    "KCL Research Seminar", "Strand Roof Terrace Break", "KCL Mental Health Workshop", 
)

course_fixtures = (
    "Computer Science",
    "Artificial Intelligence",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Law",
    "Medicine",
    "Biomedical Science",
    "Neuroscience",
    "Psychology",
    "Nursing",
    "Business Management",
    "Economics",
    "Politics",
    "History",
    "English Literature",
    "Philosophy",
    "Film Studies",
    "Digital Humanities",
    "Dentistry",
    "Geography",
    "International Relations",
)

description_fixtures = (
    "Need to get this done before the deadline.",
    "Need to review the slides before this.",
    "Check KEATS for any updates beforehand.",
    "Been putting this off for too long.",
    "Should only take an hour or two.",
    "Remember to bring student card.",
    "Check email beforehand for any updates.",
    "Meet at the main entrance.",
    "Book a study room in advance.",
    "Bring laptop and charger.",
    "Don't be late this time.",
    "Sort out what to wear the night before.",
    "Bring ID just in case.",
    "Just needs to get done today.",
    "Going with Jake so no backing out.",
    "Double check the time and location.",
    "Pick up snacks on the way.",
    "Don't forget to confirm with the group.",
    "Set a reminder the night before.",
    "Check if anyone else is coming.",
    "Reply to the group chat first.",
    "Make sure to eat before this.",
)

location_fixtures = (
    "Bush House, Strand, London WC2B 4PJ",
    "Maughan Library, Chancery Lane, London WC2A 1LR",
    "Franklin-Wilkins Building, 150 Stamford St, London SE1 9NH",
    "Waterloo Bridge Wing, Waterloo Bridge, London SE1 8WT",
    "King's Building, Strand, London WC2R 2LS",
    "Guy's Campus, Great Maze Pond, London SE1 9RT",
    "St Thomas' Hospital, Westminster Bridge Rd, London SE1 7EH",
    "Denmark Hill Campus, London SE5 9RS",
    "Strand Campus, Strand, London WC2R 2LS",
    "Somerset House, Strand, London WC2R 1LA",
    "King's Sport, Strand, London WC2R 2LS",
    "KCLSU, Macadam Building, Surrey St, London WC2R 2NS",
    "Costa Coffee, Oxford Street, London WC2B 4PJ",
    "Pret a Manger, Strand, London WC2R 1LA",
    "London Bridge Station, London SE1 9SP",
    "Temple Station, Victoria Embankment, London WC2R 2PH",
    "Holborn Station, High Holborn, London WC1V 7PP",
    "Tesco Express, Strand, London WC2R 0DX",
    "Lidl, The Cut, London SE1 8LF",
)