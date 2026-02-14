first_name_fixtures = (
    "Jacob", "Amy", "Ben", "David", "Tyrone", "Penny", "Rebecca", "Terrance", "Chris", "Jeoren"
)

last_name_fixtures = (
    "Watson", "Walker", "Jones", "Caprera", "Smith", "Starmer"
)

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

event_title = (
    "Finish Report", "Start essay", "Meeting with advisor", "Attend lecture", "Review notes", "Start application"
)

event_title_prefixes = (
    "Finish", "Start", "Review", "Meeting with", "Submit", "Attend"
)

event_title_suffixes = (
    "report", "essay", "group project", "advisor", "notes", "application"
)