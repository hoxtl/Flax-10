"""
Aggregate fixture data combining users, events, modules, deadlines, and tasks.
"""

from .user_fixtures import (
    category_fixtures,
    tag_fixtures,
    recurrence_fixtures,
    course_fixtures,
    course_to_module_prefixes,
    module_prefix_to_department,
)
from .event_fixtures import (
    event_title_fixtures,
    breakfast_fixtures,
    lunch_fixtures,
    dinner_fixtures,
    description_fixtures,
    location_fixtures,
    lecture_theatre_fixtures,
)
from .module_fixtures import module_fixtures
from .deadline_fixtures import deadline_fixtures, module_deadline_fixtures


def get_course_prefixes(course):
    """Return module code prefixes mapped to the given course."""

    return course_to_module_prefixes.get(course, [])

# Per-module-prefix task templates
# Format: (title_template, description, priority, estimated_blocks, days_from_now)
module_task_templates = {
    "CS": [
        ("{module} programming assignment",    "Complete the coding task and submit via KEATS. Test your solution locally first.", "high",   4, 5),
        ("{module} past paper",                "Work through the past exam paper under timed conditions.",                         "high",   3, 8),
        ("{module} revision: data structures", "Review lecture notes and re-implement key algorithms from scratch.",               "medium", 2, 3),
        ("{module} group project check-in",    "Review teammates' pull requests and update your section of the codebase.",         "high",   2, 1),
    ],
    "AI": [
        ("{module} model evaluation writeup", "Write up the evaluation section for the ML coursework.",              "high",   3, 6),
        ("{module} lecture notes review",     "Go through neural network slides and annotate key formulas.",          "medium", 2, 3),
        ("{module} past paper",               "Work through the past exam paper under timed conditions.",             "high",   4, 10),
    ],
    "MA": [
        ("{module} problem set",      "Complete all questions from the assignment sheet. Submit online.",              "medium", 3, 4),
        ("{module} revision session", "Go through lecture examples and redo the harder problem sheet questions.",      "medium", 2, 7),
        ("{module} exam prep",        "Work through past papers and note which topics need more focus.",               "high",   4, 11),
    ],
    "PH": [
        ("{module} lab report",  "Write up the practical. Include methodology, data, error analysis and conclusions.", "high",   4, 6),
        ("{module} problem set", "Complete the worksheet from this week's lecture. Show full working.",               "medium", 3, 3),
        ("{module} revision",    "Review derivations and key equations. Make a formula sheet.",                       "medium", 2, 9),
    ],
    "EE": [
        ("{module} lab report",   "Document the experiment. Include circuit diagram, measurements and analysis.", "high",   3, 5),
        ("{module} problem sheet","Complete the circuit analysis questions from this week.",                       "medium", 2, 8),
        ("{module} exam prep",    "Past paper practice — focus on questions you got wrong last time.",             "high",   4, 12),
    ],
    "GN": [
        ("{module} design portfolio update", "Add this week's design sketches and calculations to your portfolio.", "high",   3, 4),
        ("{module} problem set",             "Complete the engineering maths worksheet.",                           "medium", 2, 7),
    ],
    "LS4101": [
        ("{module} Lab Report: Microscopy",       "Write up the microscopy practical. Include labelled diagrams and interpretation.", "high",   4, 5),
        ("{module} Microscopy Quiz prep",        "Review staining techniques and cell identification before the KEATS quiz.",         "high",   1, 3),
        ("{module} Cell Division Diagram",      "Produce annotated mitosis and meiosis diagrams. Submit via KEATS.",               "medium", 2, 9),
    ],
    "LS4202": [
        ("{module} Enzyme Kinetics Problems",     "Complete the Michaelis-Menten and inhibition problem set. Submit via KEATS.",       "high",   4, 4),
        ("{module} Protein Folding Assignment", "Draft the protein structure and folding section. Check KEATS for rubric.",        "medium", 3, 8),
        ("{module} Metabolic Pathway Quiz",      "Revise glycolysis and TCA cycle before the KEATS quiz.",                          "high",   2, 12),
    ],
    "LS": [
        ("{module} lab report",          "Write up the lab practical. Include methodology and data analysis.",           "high",   4, 5),
        ("{module} essay plan",          "Draft a 300-word outline for the upcoming essay.",                             "high",   2, 3),
        ("{module} KEATS quiz",          "Complete the online quiz before midnight. Review lecture notes first.",        "high",   1, 2),
        ("{module} revision: key pathways", "Make a diagram of the main metabolic/cellular pathways from this week.",   "medium", 2, 8),
    ],
    "LW": [
        ("{module} essay",      "Critical legal essay on your assigned question. 1500 words. Submit via KEATS.", "high",   5, 6),
        ("{module} seminar prep","Read the assigned cases and prepare three discussion points.",                  "medium", 2, 3),
        ("{module} revision",   "Review lecture notes and compile a list of key cases with brief facts.",        "medium", 3, 10),
    ],
    "PS": [
        ("{module} research report draft", "Write up the introduction and method sections.",                           "medium", 3, 7),
        ("{module} reading",               "Read the assigned journal articles and annotate key findings.",            "medium", 2, 3),
        ("{module} revision",              "Review cognitive models and make flashcards for key studies.",             "medium", 2, 11),
    ],
    "BM": [
        ("{module} case study analysis", "Analyse the assigned company. 2500 words.",                                  "high",   6, 8),
        ("{module} seminar prep",        "Read the Harvard case and prepare two strategic recommendations.",           "medium", 2, 3),
        ("{module} revision",            "Review strategic frameworks: Porter's Five Forces, SWOT, PESTLE.",           "medium", 2, 6),
    ],
    "EC": [
        ("{module} economics essay", "Analytical essay applying theory to a real-world issue. 2000 words.",            "medium", 4, 9),
        ("{module} problem set",     "Complete the microeconomics worksheet from this week's lecture.",                "medium", 2, 4),
        ("{module} revision",        "Review supply/demand models and go through past short-answer questions.",        "medium", 2, 7),
    ],
    "HI": [
        ("{module} essay",       "Historical essay on your assigned question. 2500 words. Chicago referencing.", "high",   5, 10),
        ("{module} seminar reading","Read the set texts and prepare three discussion points for seminar.",       "medium", 2, 4),
        ("{module} source analysis","Annotate the primary source document — consider context, bias and significance.", "medium", 2, 7),
    ],
    "EN": [
        ("{module} essay",              "Close reading essay on the assigned text. 2500 words. MLA referencing.", "high",   5, 11),
        ("{module} seminar presentation","Prepare a 10-minute seminar discussion on your assigned passage.",      "high",   3, 5),
        ("{module} reading",            "Read the set text for this week and annotate key themes.",               "medium", 2, 3),
    ],
    "PL": [
        ("{module} essay",      "Argumentative philosophy essay. 2000 words. Defend your assigned position.", "medium", 5, 9),
        ("{module} seminar prep","Read the set chapter and prepare two objections for discussion.",            "medium", 2, 4),
        ("{module} revision",   "Make flashcards for key arguments, philosophers and counter-arguments.",     "low",    2, 7),
    ],
    "PO": [
        ("{module} policy brief",  "1500-word policy brief on your assigned political issue.",              "medium", 3, 6),
        ("{module} seminar prep",  "Read the assigned article and prepare three discussion questions.",    "medium", 2, 10),
    ],
    "IR": [
        ("{module} essay",      "Analytical essay applying IR theory to a current issue. 2500 words.",   "high",   5, 8),
        ("{module} seminar prep","Read the assigned chapters and prepare a brief summary of each theory.","medium", 2, 4),
    ],
    "NU": [
        ("{module} reflective portfolio entry", "Write a Gibbs cycle reflection on last week's clinical placement.", "high",   3, 5),
        ("{module} OSCE prep",                  "Practise the clinical skill steps and review the assessment criteria.", "high",   3, 9),
    ],
    "DE": [
        ("{module} clinical case report", "Document the patient case — diagnosis, treatment plan and reflection.", "high",   4, 6),
        ("{module} anatomy revision",     "Review the oral anatomy diagrams and label key structures from memory.", "medium", 2, 3),
    ],
    "FR": [
        ("{module} written assignment", "Complete the French essay or translation exercise from KEATS.", "medium", 3, 7),
        ("{module} vocabulary practice","Review this week's vocab list and write example sentences for each term.", "low", 1, 3),
        ("{module} oral prep",          "Practise speaking the set topic aloud — record yourself and review.", "medium", 2, 10),
    ],
    "SP": [
        ("{module} written assignment", "Complete the Spanish written exercise from KEATS.", "medium", 3, 6),
        ("{module} vocabulary practice","Review this week's vocab list and write example sentences.", "low", 1, 3),
        ("{module} oral prep",          "Practise speaking the set topic aloud — record yourself and review.", "medium", 2, 8),
        ("{module} grammar exercise",   "Complete the grammar worksheet focusing on the subjunctive.", "medium", 2, 12),
    ],
    "GL": [
        ("{module} written assignment",  "Complete the German written exercise from KEATS.", "medium", 3, 7),
        ("{module} vocabulary practice", "Review this week's vocab list and write example sentences.", "low", 1, 4),
        ("{module} translation practice","Translate the set passage from German to English and check with model answer.", "medium", 2, 9),
    ],
    "AR": [
        ("{module} written assignment", "Complete the Arabic written exercise from KEATS.", "medium", 3, 6),
        ("{module} script practice",    "Practise writing this week's new vocabulary in Arabic script.", "low", 1, 10),
    ],
    "ZH": [
        ("{module} written assignment",  "Complete the Mandarin written exercise from KEATS.", "medium", 3, 5),
        ("{module} character practice",  "Write out this week's new characters 10 times each.", "low", 1, 8),
    ],
    "MU": [
        ("{module} listening log entry", "Write a 200-word analytical response to the set recording.", "medium", 2, 5),
        ("{module} theory exercise",     "Complete the harmony worksheet from this week's tutorial.", "medium", 2, 9),
    ],
    "GE": [
        ("{module} essay",       "Essay on the assigned geographic concept. 2000 words.", "medium", 4, 8),
        ("{module} seminar prep","Read the set article and annotate key arguments.", "medium", 2, 4),
    ],
}

# Module-specific pill colours for Action Hub / Today's Plan (LS4101/LS4202 distinct)
MODULE_PILL_COLORS = {
    "LS4101": "#5D4037",   # Deep Earth Brown
    "LS4202": "#C4A77D",   # Muted Clay
}

# Format: (name, category, emoji)
task_list_fixtures = (
    ("Personal",     "personal", "🟡"),
    ("Internships",  "personal", "💼"),
    ("Health",       "personal", "🏃"),
    ("Finance",      "personal", "💰"),
    ("Home & Admin", "personal", "🏠"),
)

# Task lists for teacher users — teaching-specific lists use "Teaching - " prefix
# so the frontend groups them under MY TEACHING. Life lists mirror student defaults.
teacher_task_list_fixtures = (
    ("Personal",                   "personal", "🟡"),
    ("Health",                     "personal", "🏃"),
    ("Finance",                    "personal", "💰"),
    ("Home & Admin",               "personal", "🏠"),
    ("Teaching - University Admin","personal", "🏛️"),
    ("Teaching - Marking & Grading","personal","📝"),
    ("Teaching - Research",        "personal", "🔬"),
)

# Format: (title, description, priority, estimated_blocks, days_from_now, list_name, completed)
# list_name must match one of teacher_task_list_fixtures
teacher_personal_task_fixtures = (
    # University Admin — mix of done and pending
    ("Go to HR meeting",               "Attend the HR staff meeting — check calendar invite for room and agenda.",          "medium", 1,  1,  "Teaching - University Admin", False),
    ("Submit module enrolment data",   "Export and submit student enrolment numbers to the registry.",                      "high",   2,  2,  "Teaching - University Admin", False),
    ("Update module KEATS page",       "Upload this week's lecture slides and any new resources to KEATS.",                 "medium", 1,  2,  "Teaching - University Admin", False),
    ("Reply to student emails",        "Work through the student email backlog — flag anything that needs escalation.",     "medium", 1,  0,  "Teaching - University Admin", False),
    ("Book room for office hours",     "Reserve a meeting room for next week's office hours via the room booking portal.",  "low",    1,  3,  "Teaching - University Admin", False),
    ("Complete staff appraisal form",  "Fill in the annual appraisal form and send to your line manager.",                  "high",   2,  7,  "Teaching - University Admin", False),
    ("Respond to exam board email",    "Review and respond to the exam board secretary's query.",                           "high",   1,  1,  "Teaching - University Admin", False),
    ("Send welcome email to students", "Email the module welcome message with KEATS link and office hours schedule.",       "medium", 1,  0,  "Teaching - University Admin", True),
    ("Submit timetable preferences",   "Fill in the scheduling form for next semester's timetable.",                        "low",    1, -8,  "Teaching - University Admin", True),
    ("Attend staff induction day",     "Mandatory staff induction — confirm attendance and note room number.",              "high",   1, -3,  "Teaching - University Admin", True),

    # Marking & Grading — some already done
    ("Grade coursework batch 1",       "Mark the first batch of submitted coursework. Record grades in KEATS.",             "high",   4,  3,  "Teaching - Marking & Grading", False),
    ("Return feedback to students",    "Upload annotated feedback to KEATS and notify students via announcement.",          "high",   2,  5,  "Teaching - Marking & Grading", False),
    ("Grade end-of-term exams",        "Complete marking for the exam scripts. Cross-check borderline cases.",              "high",   6,  8,  "Teaching - Marking & Grading", False),
    ("Second mark spot-check",         "Do a second-mark review on a random 10% sample for moderation purposes.",          "medium", 2,  10, "Teaching - Marking & Grading", False),
    ("Update gradebook",               "Enter all finalised grades into the official gradebook before the deadline.",       "high",   1,  6,  "Teaching - Marking & Grading", False),
    ("Mark mid-term quiz",             "Grade the KEATS auto-marked quiz and review any flagged anomalies.",                "medium", 1, -4,  "Teaching - Marking & Grading", True),
    ("Return essays from last term",   "Upload all marked essays to KEATS with individual feedback comments.",              "high",   3, -7,  "Teaching - Marking & Grading", True),
    ("Moderate a colleague's marking", "Spot-check 10 scripts for the moderation exercise and complete the report.",       "medium", 2, -2,  "Teaching - Marking & Grading", True),

    # Research — a few completed milestones
    ("Write literature review section","Draft the literature review section for the current research paper.",               "high",   4,  5,  "Teaching - Research", False),
    ("Submit conference abstract",     "Finalise and submit the abstract to the upcoming conference by the deadline.",      "high",   2,  4,  "Teaching - Research", False),
    ("Review journal submission",      "Complete peer review for the assigned journal article.",                            "medium", 3,  9,  "Teaching - Research", False),
    ("Update research project log",    "Record this week's progress notes and update the shared project tracker.",         "low",    1,  7,  "Teaching - Research", False),
    ("Apply for research grant",       "Compile supporting documents and submit the grant application before closing date.","high",   4,  14, "Teaching - Research", False),
    ("Submit ethics approval form",    "Complete and submit the ethics form for the new data collection study.",            "high",   2, -6,  "Teaching - Research", True),
    ("Present at departmental seminar","Deliver the 20-minute research update to the department.",                          "medium", 2, -10, "Teaching - Research", True),

    # Life tasks
    ("Morning run",                    "30 min — don't skip it this week.",                                                 "low",    1,  2,  "Health",      False),
    ("GP appointment",                 "Nothing urgent — just a general check-up.",                                        "low",    1,  5,  "Health",      False),
    ("Book dentist appointment",       "Overdue — call and book for sometime next month.",                                  "low",    1,  8,  "Health",      False),
    ("Track spending this week",       "Log all expenses and check you're on budget.",                                     "low",    1,  3,  "Finance",     False),
    ("Renew railcard",                 "Check expiry date and renew online before it runs out.",                           "low",    1,  10, "Finance",     False),
    ("Tidy desk and study space",      "A clear space = a clear mind. 15 mins max.",                                       "low",    1,  6,  "Home & Admin",False),
    ("Plan next week's meals",         "Decide on 3-4 dinners and write a shopping list.",                                 "low",    1,  7,  "Home & Admin",False),
    ("Weekly review",                  "Go through what you completed and what carried over from last week.",              "medium", 1,  7,  "Personal",    False),
    ("Plan the week ahead",            "Look at the week's deadlines and block out focused work time.",                    "medium", 1,  0,  "Personal",    False),
    ("Gym session",                    "Upper body + core.",                                                               "low",    1, -3,  "Health",      True),
    ("Pay council tax",                "Set up standing order for the new academic year.",                                  "medium", 1, -5,  "Finance",     True),
)

# Format: (title, description, priority, estimated_blocks, days_from_now, list_name)
# list_name must match one of the names in task_list_fixtures above
personal_task_fixtures = (
    ("Submit ethics form",              "Missed the window — chase the admin office and resubmit ASAP.",              "urgent", 1, -1, "Personal"),
    ("Pay rent",                        "Bank transfer due — check landlord details before sending.",                  "high",   1, -2, "Finance"),

    ("Send supervisor check-in",        "Confirm this week's milestones and attach your latest draft snapshot.",       "urgent", 1,  0, "Personal"),
    ("Plan the week ahead",             "Look at the week's deadlines and block out study time in your calendar.",   "medium", 1,  0, "Personal"),
    ("Scan KEATS for surprises",        "Quick sweep of module pages for hidden updates, new files, and changes.",   "low",    1,  0, "Personal"),

    ("Beat the weekly KEATS quiz",      "Complete the quiz in one focused block before the midnight lockout.",       "urgent", 1,  1, "Personal"),
    ("Morning run",                     "30 min — don't skip it this week.",                                         "low",    1,  2, "Health"),

    ("Book a Maughan deep-focus slot",  "Reserve a quiet room and lock in a distraction-free revision sprint.",      "medium", 1,  2, "Personal"),
    ("Build this week's flashcard pack","Turn lecture takeaways into an Anki deck you can actually reuse later.",    "low",    2,  2, "Personal"),
    ("Track spending this week",        "Log all expenses and check you're on budget.",                              "low",    1,  2, "Finance"),

    ("Research internship deadlines",   "Check application deadlines for your target companies.",                    "urgent", 1,  3, "Internships"),
    ("Seminar talking points prep",     "Re-read the core text and draft two sharp questions for discussion.",       "medium", 2,  3, "Personal"),
    ("GP appointment",                  "Nothing urgent — just a general check-up.",                                 "low",    1,  3, "Health"),

    ("Book dentist appointment",        "Overdue — call and book for sometime next month.",                          "low",    1,  4, "Health"),
    ("Past-paper speed run",            "Attempt one full paper in exam conditions and note your weak spots.",       "urgent", 4,  4, "Personal"),

    ("Update CV",                       "Add the latest project or placement before applying to grad roles.",        "medium", 2,  5, "Internships"),
    ("Draft personal statement section","Write 200 words on your academic motivation.",                              "high",   3,  5, "Internships"),

    ("Tidy desk and study space",       "A clear space = a clear mind. 15 mins max.",                                "low",    1,  6, "Home & Admin"),
    ("Plan next week's meals",          "Decide on 3-4 dinners and write a shopping list.",                         "low",    1,  6, "Home & Admin"),
    ("Ship lab report draft v1",        "Submit your first draft early so you still have time to iterate.",          "high",   3,  6, "Personal"),

    ("Weekly review",                   "Go through what you completed and what carried over from last week.",       "medium", 1,  7, "Personal"),
    ("Renew railcard",                  "Check expiry date and renew online before it runs out.",                   "low",    1,  7, "Finance"),
    ("Respond to LinkedIn messages",    "Reply to any internship or network messages.",                              "medium", 1,  7, "Internships"),

    ("Apply to summer internship",      "Submit application before deadline — check requirements on portal.",       "high",   2,  8, "Internships"),
    ("Gym session",                     "Upper body + core. Don't skip leg day next time.",                         "low",    2,  9, "Health"),
    ("Practice interview questions",    "Go through the STAR method for behavioural questions.",                    "high",   2,  10, "Internships"),

    ("Buy train ticket home",           "Book the cheapest advance ticket while they're still available.",          "medium", 1,  11, "Finance"),
    ("Mid-semester self-assessment",    "Reflect on your progress and identify two areas to improve.",              "medium", 2,  12, "Personal"),

    ("Sort student email aliases",      "Check your KCL email is forwarded correctly.",                             "low",    1,  16, "Home & Admin"),
    ("Deep clean the kitchen",          "Full wipe-down — fridge, oven, surfaces.",                                 "low",    2,  18, "Home & Admin"),

    ("Reach out to alumni network",     "Message two people for a 15-minute informational chat.",                   "medium", 2,  25, "Internships"),
    ("Final essay polish pass",         "Read it aloud, tighten the argument, and clean up phrasing before submit.", "high",   2,  28, "Personal"),
    ("Budget review",                   "Check your spending against this month's budget.",                         "medium", 1,  30, "Finance"),
    ("Back up laptop files",            "Upload everything to Google Drive or external hard drive.",                "low",    1,  35, "Home & Admin"),
)

reading_fixtures = [
    ("Module Handbook", "Ch.9", 1, 45),
    ("Advanced Topics", "Ch.5", 41, 80),
    ("Case Studies & Applications", "Ch.3", 35, 78),
    ("Core Principles", "Ch.13", 121, 155),
    ("Research Methods Overview", "Ch.1", 1, 32),
    ("Key Theories & Frameworks", "Ch.7", 88, 120),
]

__all__ = [
    "category_fixtures",
    "tag_fixtures",
    "recurrence_fixtures",
    "course_fixtures",
    "course_to_module_prefixes",
    "module_prefix_to_department",
    "event_title_fixtures",
    "breakfast_fixtures",
    "lunch_fixtures",
    "dinner_fixtures",
    "description_fixtures",
    "location_fixtures",
    "lecture_theatre_fixtures",
    "module_fixtures",
    "deadline_fixtures",
    "module_deadline_fixtures",
    "module_task_templates",
    "MODULE_PILL_COLORS",
    "task_list_fixtures",
    "personal_task_fixtures",
    "teacher_task_list_fixtures",
    "teacher_personal_task_fixtures",
    "reading_fixtures",
]
