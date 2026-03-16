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

# Per-module-prefix task templates
# Format: (title_template, description, priority, estimated_blocks, days_from_now)
module_task_templates = {
    "CS": [
        ("{module} programming assignment",    "Complete the coding task and submit via KEATS. Test your solution locally first.", "high",   4, 3),
        ("{module} past paper",                "Work through the past exam paper under timed conditions.",                         "high",   3, 5),
        ("{module} revision: data structures", "Review lecture notes and re-implement key algorithms from scratch.",               "medium", 2, 2),
        ("{module} group project check-in",    "Review teammates' pull requests and update your section of the codebase.",         "high",   2, 1),
    ],
    "AI": [
        ("{module} model evaluation writeup", "Write up the evaluation section for the ML coursework.",              "high",   3, 3),
        ("{module} lecture notes review",     "Go through neural network slides and annotate key formulas.",          "medium", 2, 2),
        ("{module} past paper",               "Work through the past exam paper under timed conditions.",             "high",   4, 5),
    ],
    "MA": [
        ("{module} problem set",      "Complete all questions from the assignment sheet. Submit online.",              "medium", 3, 3),
        ("{module} revision session", "Go through lecture examples and redo the harder problem sheet questions.",      "medium", 2, 2),
        ("{module} exam prep",        "Work through past papers and note which topics need more focus.",               "high",   4, 5),
    ],
    "PH": [
        ("{module} lab report",  "Write up the practical. Include methodology, data, error analysis and conclusions.", "high",   4, 4),
        ("{module} problem set", "Complete the worksheet from this week's lecture. Show full working.",               "medium", 3, 2),
        ("{module} revision",    "Review derivations and key equations. Make a formula sheet.",                       "medium", 2, 3),
    ],
    "EE": [
        ("{module} lab report",   "Document the experiment. Include circuit diagram, measurements and analysis.", "high",   3, 4),
        ("{module} problem sheet","Complete the circuit analysis questions from this week.",                       "medium", 2, 2),
        ("{module} exam prep",    "Past paper practice — focus on questions you got wrong last time.",             "high",   4, 5),
    ],
    "GN": [
        ("{module} design portfolio update", "Add this week's design sketches and calculations to your portfolio.", "high",   3, 3),
        ("{module} problem set",             "Complete the engineering maths worksheet.",                           "medium", 2, 2),
    ],
    "LS4101": [
        ("{module} Lab Report: Microscopy",       "Write up the microscopy practical. Include labelled diagrams and interpretation.", "high",   4, 3),
        ("{module} Microscopy Quiz prep",        "Review staining techniques and cell identification before the KEATS quiz.",         "high",   1, 1),
        ("{module} Cell Division Diagram",      "Produce annotated mitosis and meiosis diagrams. Submit via KEATS.",               "medium", 2, 5),
    ],
    "LS4202": [
        ("{module} Enzyme Kinetics Problems",     "Complete the Michaelis-Menten and inhibition problem set. Submit via KEATS.",       "high",   4, 2),
        ("{module} Protein Folding Assignment", "Draft the protein structure and folding section. Check KEATS for rubric.",        "medium", 3, 4),
        ("{module} Metabolic Pathway Quiz",      "Revise glycolysis and TCA cycle before the KEATS quiz.",                          "high",   2, 6),
    ],
    "LS": [
        ("{module} lab report",          "Write up the lab practical. Include methodology and data analysis.",           "high",   4, 3),
        ("{module} essay plan",          "Draft a 300-word outline for the upcoming essay.",                             "high",   2, 1),
        ("{module} KEATS quiz",          "Complete the online quiz before midnight. Review lecture notes first.",        "high",   1, 1),
        ("{module} revision: key pathways", "Make a diagram of the main metabolic/cellular pathways from this week.",   "medium", 2, 4),
    ],
    "LW": [
        ("{module} essay",      "Critical legal essay on your assigned question. 1500 words. Submit via KEATS.", "high",   5, 4),
        ("{module} seminar prep","Read the assigned cases and prepare three discussion points.",                  "medium", 2, 1),
        ("{module} revision",   "Review lecture notes and compile a list of key cases with brief facts.",        "medium", 3, 3),
    ],
    "PS": [
        ("{module} research report draft", "Write up the introduction and method sections.",                           "medium", 3, 4),
        ("{module} reading",               "Read the assigned journal articles and annotate key findings.",            "medium", 2, 2),
        ("{module} revision",              "Review cognitive models and make flashcards for key studies.",             "medium", 2, 3),
    ],
    "BM": [
        ("{module} case study analysis", "Analyse the assigned company. 2500 words.",                                  "high",   6, 4),
        ("{module} seminar prep",        "Read the Harvard case and prepare two strategic recommendations.",           "medium", 2, 1),
        ("{module} revision",            "Review strategic frameworks: Porter's Five Forces, SWOT, PESTLE.",           "medium", 2, 3),
    ],
    "EC": [
        ("{module} economics essay", "Analytical essay applying theory to a real-world issue. 2000 words.",            "medium", 4, 5),
        ("{module} problem set",     "Complete the microeconomics worksheet from this week's lecture.",                "medium", 2, 2),
        ("{module} revision",        "Review supply/demand models and go through past short-answer questions.",        "medium", 2, 3),
    ],
    "HI": [
        ("{module} essay",       "Historical essay on your assigned question. 2500 words. Chicago referencing.", "high",   5, 5),
        ("{module} seminar reading","Read the set texts and prepare three discussion points for seminar.",       "medium", 2, 1),
        ("{module} source analysis","Annotate the primary source document — consider context, bias and significance.", "medium", 2, 3),
    ],
    "EN": [
        ("{module} essay",              "Close reading essay on the assigned text. 2500 words. MLA referencing.", "high",   5, 5),
        ("{module} seminar presentation","Prepare a 10-minute seminar discussion on your assigned passage.",      "high",   3, 2),
        ("{module} reading",            "Read the set text for this week and annotate key themes.",               "medium", 2, 1),
    ],
    "PL": [
        ("{module} essay",      "Argumentative philosophy essay. 2000 words. Defend your assigned position.", "medium", 5, 5),
        ("{module} seminar prep","Read the set chapter and prepare two objections for discussion.",            "medium", 2, 1),
        ("{module} revision",   "Make flashcards for key arguments, philosophers and counter-arguments.",     "low",    2, 4),
    ],
    "PO": [
        ("{module} policy brief",  "1500-word policy brief on your assigned political issue.",              "medium", 3, 4),
        ("{module} seminar prep",  "Read the assigned article and prepare three discussion questions.",    "medium", 2, 1),
    ],
    "IR": [
        ("{module} essay",      "Analytical essay applying IR theory to a current issue. 2500 words.",   "high",   5, 5),
        ("{module} seminar prep","Read the assigned chapters and prepare a brief summary of each theory.","medium", 2, 1),
    ],
    "NU": [
        ("{module} reflective portfolio entry", "Write a Gibbs cycle reflection on last week's clinical placement.", "high",   3, 2),
        ("{module} OSCE prep",                  "Practise the clinical skill steps and review the assessment criteria.", "high",   3, 3),
    ],
    "DE": [
        ("{module} clinical case report", "Document the patient case — diagnosis, treatment plan and reflection.", "high",   4, 4),
        ("{module} anatomy revision",     "Review the oral anatomy diagrams and label key structures from memory.", "medium", 2, 2),
    ],
    "FR": [
        ("{module} written assignment", "Complete the French essay or translation exercise from KEATS.", "medium", 3, 4),
        ("{module} vocabulary practice","Review this week's vocab list and write example sentences for each term.", "low", 1, 2),
        ("{module} oral prep",          "Practise speaking the set topic aloud — record yourself and review.", "medium", 2, 3),
    ],
    "SP": [
        ("{module} written assignment", "Complete the Spanish written exercise from KEATS.", "medium", 3, 4),
        ("{module} vocabulary practice","Review this week's vocab list and write example sentences.", "low", 1, 2),
        ("{module} oral prep",          "Practise speaking the set topic aloud — record yourself and review.", "medium", 2, 3),
        ("{module} grammar exercise",   "Complete the grammar worksheet focusing on the subjunctive.", "medium", 2, 1),
    ],
    "GL": [
        ("{module} written assignment",  "Complete the German written exercise from KEATS.", "medium", 3, 4),
        ("{module} vocabulary practice", "Review this week's vocab list and write example sentences.", "low", 1, 2),
        ("{module} translation practice","Translate the set passage from German to English and check with model answer.", "medium", 2, 3),
    ],
    "AR": [
        ("{module} written assignment", "Complete the Arabic written exercise from KEATS.", "medium", 3, 4),
        ("{module} script practice",    "Practise writing this week's new vocabulary in Arabic script.", "low", 1, 2),
    ],
    "ZH": [
        ("{module} written assignment",  "Complete the Mandarin written exercise from KEATS.", "medium", 3, 4),
        ("{module} character practice",  "Write out this week's new characters 10 times each.", "low", 1, 2),
    ],
    "MU": [
        ("{module} listening log entry", "Write a 200-word analytical response to the set recording.", "medium", 2, 3),
        ("{module} theory exercise",     "Complete the harmony worksheet from this week's tutorial.", "medium", 2, 2),
    ],
    "GE": [
        ("{module} essay",       "Essay on the assigned geographic concept. 2000 words.", "medium", 4, 5),
        ("{module} seminar prep","Read the set article and annotate key arguments.", "medium", 2, 1),
    ],
}

# Module-specific pill colours for Action Hub / Today's Plan (LS4101/LS4202 distinct)
MODULE_PILL_COLORS = {
    "LS4101": "#5D4037",   # Deep Earth Brown
    "LS4202": "#C4A77D",   # Muted Clay
}

# ── Task lists seeded per user ─────────────────────────────────────────────
# Format: (name, category, emoji)
task_list_fixtures = (
    ("University",   "uni",      "📘"),
    ("Personal",     "personal", "🟡"),
    ("Internships",  "personal", "💼"),
    ("Health",       "personal", "🏃"),
    ("Finance",      "personal", "💰"),
    ("Reading List", "personal", "📖"),
    ("Home & Admin", "personal", "🏠"),
)

# ── Personal tasks seeded for every user ───────────────────────────────────
# Format: (title, description, priority, estimated_blocks, days_from_now, list_name)
# list_name must match one of the names in task_list_fixtures above
personal_task_fixtures = (
    # ── Overdue ──
    ("Submit ethics form",              "Missed the window — chase the admin office and resubmit ASAP.",              "urgent", 1, -1, "University"),
    ("Pay rent",                        "Bank transfer due — check landlord details before sending.",                  "high",   1, -2, "Finance"),

    # ── Today ──
    ("Send supervisor check-in",        "Confirm this week's milestones and attach your latest draft snapshot.",       "urgent", 1,  0, "University"),
    ("Plan the week ahead",             "Look at the week's deadlines and block out study time in your calendar.",   "medium", 1,  0, "Personal"),
    ("Scan KEATS for surprises",        "Quick sweep of module pages for hidden updates, new files, and changes.",   "low",    1,  0, "University"),

    # ── Day 1 ──
    ("Beat the weekly KEATS quiz",      "Complete the quiz in one focused block before the midnight lockout.",       "urgent", 1,  1, "University"),
    ("Morning run",                     "30 min — don't skip it this week.",                                         "low",    1,  1, "Health"),

    # ── Day 2 ──
    ("Book a Maughan deep-focus slot",  "Reserve a quiet room and lock in a distraction-free revision sprint.",      "medium", 1,  2, "University"),
    ("Build this week's flashcard pack","Turn lecture takeaways into an Anki deck you can actually reuse later.",    "low",    2,  2, "University"),
    ("Track spending this week",        "Log all expenses and check you're on budget.",                              "low",    1,  2, "Finance"),

    # ── Day 3 ──
    ("Research internship deadlines",   "Check application deadlines for your target companies.",                    "urgent", 1,  3, "Internships"),
    ("Seminar talking points prep",     "Re-read the core text and draft two sharp questions for discussion.",       "medium", 2,  3, "University"),
    ("GP appointment",                  "Nothing urgent — just a general check-up.",                                 "low",    1,  3, "Health"),

    # ── Day 4 ──
    ("Book dentist appointment",        "Overdue — call and book for sometime next month.",                          "low",    1,  4, "Health"),
    ("Past-paper speed run",            "Attempt one full paper in exam conditions and note your weak spots.",       "urgent", 4,  4, "University"),

    # ── Day 5 ──
    ("Update CV",                       "Add the latest project or placement before applying to grad roles.",        "medium", 2,  5, "Internships"),
    ("Read journal article",            "Annotate the assigned paper for next week's seminar.",                      "medium", 2,  5, "Reading List"),
    ("Draft personal statement section","Write 200 words on your academic motivation.",                              "high",   3,  5, "Internships"),

    # ── Day 6 ──
    ("Tidy desk and study space",       "A clear space = a clear mind. 15 mins max.",                                "low",    1,  6, "Home & Admin"),
    ("Plan next week's meals",          "Decide on 3-4 dinners and write a shopping list.",                         "low",    1,  6, "Home & Admin"),
    ("Ship lab report draft v1",        "Submit your first draft early so you still have time to iterate.",          "high",   3,  6, "University"),

    # ── Day 7 ──
    ("Weekly review",                   "Go through what you completed and what carried over from last week.",       "medium", 1,  7, "Personal"),
    ("Renew railcard",                  "Check expiry date and renew online before it runs out.",                   "low",    1,  7, "Finance"),
    ("Respond to LinkedIn messages",    "Reply to any internship or network messages.",                              "medium", 1,  7, "Internships"),

    # ── Day 8-10 ──
    ("Apply to summer internship",      "Submit application before deadline — check requirements on portal.",       "high",   2,  8, "Internships"),
    ("Gym session",                     "Upper body + core. Don't skip leg day next time.",                         "low",    2,  9, "Health"),
    ("Practice interview questions",    "Go through the STAR method for behavioural questions.",                    "high",   2,  10, "Internships"),

    # ── Day 11-14 ──
    ("Buy train ticket home",           "Book the cheapest advance ticket while they're still available.",          "medium", 1,  11, "Finance"),
    ("Mid-semester self-assessment",    "Reflect on your progress and identify two areas to improve.",              "medium", 2,  12, "Personal"),

    # ── Day 15-21 ──
    ("Sort student email aliases",      "Check your KCL email is forwarded correctly.",                             "low",    1,  16, "Home & Admin"),
    ("Deep clean the kitchen",          "Full wipe-down — fridge, oven, surfaces.",                                 "low",    2,  18, "Home & Admin"),

    # ── Day 22-35 ──
    ("Reach out to alumni network",     "Message two people for a 15-minute informational chat.",                   "medium", 2,  25, "Internships"),
    ("Final essay polish pass",         "Read it aloud, tighten the argument, and clean up phrasing before submit.", "high",   2,  28, "University"),
    ("Budget review",                   "Check your spending against this month's budget.",                         "medium", 1,  30, "Finance"),
    ("Back up laptop files",            "Upload everything to Google Drive or external hard drive.",                "low",    1,  35, "Home & Admin"),

    # ── Reading list ──
    ("Read: Thinking, Fast and Slow",   "Kahneman — read chapters 1-5 and take notes.",                             "low",    3,  10, "Reading List"),
    ("Read: The Pragmatic Programmer",  "Chapter 2-3. Note anything applicable to your project.",                   "low",    2,  14, "Reading List"),
    ("Read: Why Nations Fail",          "First 4 chapters. Consider how it connects to your IR module.",            "low",    3,  20, "Reading List"),
)

reading_fixtures = [ 
    ("Module Handbook", "Ch.9", 1, 45),
    ("Advanced Topics", "Ch.5", 41, 80),
    ("Case Studies & Applications", "Ch.3", 35, 78),
    ("Core Principles", "Ch.13", 121,155),
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
    "reading_fixtures",
]
