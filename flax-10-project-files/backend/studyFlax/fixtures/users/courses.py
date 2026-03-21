"""
User-level lookup tables and course configuration fixtures.

Provides default categories, event tags, recurrence rule templates, the
KCL course catalogue, a mapping from course name to module-code prefixes,
and a mapping from module-code prefix to faculty department.
"""

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
    ('Deadline', 0),
    ('Exam', 120),
    ('Schedule', 60),
    ('Meals', 45),
    ('Other', 30),
)

# Format: (frequency, interval)
recurrence_fixtures = (
    ('daily', 1),
    ('weekly', 1),
    ('weekly', 2),
    ('monthly', 1),
)

course_fixtures = (
    "Computer Science", "Artificial Intelligence", "Mathematics", "Physics", "Chemistry",
    "Law", "Medicine", "Biomedical Science", "Neuroscience", "Psychology", "Nursing",
    "Business Management", "Economics", "Politics", "History", "English Literature",
    "Philosophy", "Film Studies", "Dentistry", "Geography", "International Relations",
    "French", "Spanish", "German", "Modern Languages", "Music", "Classical Studies",
)

course_to_module_prefixes = {
    "Computer Science": ["CS"],
    "Artificial Intelligence": ["CS", "AI"],
    "Mathematics": ["MA"],
    "Physics": ["PH", "MA"],
    "Electronic Engineering": ["EE", "PH", "MA"],
    "General Engineering": ["GN", "PH", "MA"],
    "Chemistry": ["CH", "PH", "LS"],
    "Biomedical Science": ["LS"],
    "Neuroscience": ["NS", "LS", "PS"],
    "Psychology": ["PS"],
    "Midwifery": ["MW", "NU"],
    "Nursing": ["NU", "LS"],
    "Dentistry": ["DE"],
    "Law": ["LW"],
    "Business Management": ["BM", "EC"],
    "Computer Science with Management": ["CM", "CS", "BM"],
    "Accounting & Finance": ["AF", "BM", "EC"],
    "Economics": ["EC", "BM"],
    "International Management": ["IM", "BM", "EC"],
    "History": ["HI"],
    "English Literature": ["EN"],
    "Philosophy": ["PL"],
    "Film Studies": ["EN", "TH"],
    "Politics": ["PO", "IR"],
    "International Relations": ["IR", "PO"],
    "Geography": ["GE", "PO"],
    "Modern Languages": ["FR", "SP", "GL", "AR", "ZH"],
    "French": ["FR"],
    "Spanish": ["SP"],
    "German": ["GL"],
    "Italian": ["IT"],
    "Portuguese": ["PT"],
    "Music": ["MU"],
    "Classical Studies": ["CL"],
    "Medicine": ["MD", "LS"],
}

module_prefix_to_department = {
    "AF": "Business",
    "CS": "Natural, Mathematical & Engineering Sciences",
    "CM": "Business",
    "AI": "Natural, Mathematical & Engineering Sciences",
    "MA": "Natural, Mathematical & Engineering Sciences",
    "CH": "Natural, Mathematical & Engineering Sciences",
    "PH": "Natural, Mathematical & Engineering Sciences",
    "EE": "Natural, Mathematical & Engineering Sciences",
    "GN": "Natural, Mathematical & Engineering Sciences",
    "LS": "Life Sciences & Medicine",
    "MD": "Life Sciences & Medicine",
    "MW": "Nursing, Midwifery & Palliative Care",
    "NS": "Psychiatry, Psychology & Neuroscience",
    "LW": "Law",
    "PS": "Psychiatry, Psychology & Neuroscience",
    "BM": "Business",
    "EC": "Business",
    "HI": "Arts & Humanities",
    "EN": "Arts & Humanities",
    "PL": "Arts & Humanities",
    "GE": "Social Science & Public Policy",
    "PO": "Social Science & Public Policy",
    "IR": "Social Science & Public Policy",
    "NU": "Nursing, Midwifery & Palliative Care",
    "DE": "Dentistry, Oral & Craniofacial Sciences",
    "FR": "Arts & Humanities",
    "SP": "Arts & Humanities",
    "GL": "Arts & Humanities",
    "AR": "Arts & Humanities",
    "ZH": "Arts & Humanities",
    "IT": "Arts & Humanities",
    "PT": "Arts & Humanities",
    "IM": "Business",
    "FA": "Arts & Humanities",
    "TH": "Arts & Humanities",
    "MU": "Arts & Humanities",
    "CL": "Arts & Humanities",
    "CR": "Arts & Humanities",
}
