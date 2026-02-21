from zoneinfo import ZoneInfo

# ── Categories ────────────────────────────────────────────────────────────────
# Format: (name, color, is_default)
category_fixtures = (
    ('Work', '#FF5733', True),
    ('University', '#33FF57', True),
    ('Personal', '#3357FF', True),
    ('Chores', '#FF33A8', False),
    ('Social', '#A833FF', False),
    ('Health', '#33FFF5', False),
)

# ── Tags ──────────────────────────────────────────────────────────────────────
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

# ── Recurrence rules ──────────────────────────────────────────────────────────
# Format: (frequency, interval)
recurrence_fixtures = (
    ('daily', 1),
    ('weekly', 1),
    ('weekly', 2),
    ('monthly', 1),
)

# ── Personal event titles ─────────────────────────────────────────────────────
event_title_fixtures = (
    "Lidl Run", "Tesco Express at Midnight", "Meal Prep Sunday",
    "Coffee with Mum at Costa", "Dinner at Grandma's",
    "Brunch with the Girls", "Drinks with Flatmates",
    "Sam's Birthday Pres", "Movie Night with Housemates",
    "FaceTime with Home", "Prep for seminar",
    "Detox Run", "Gym with Jake",
    "Yoga before Lectures", "Internship Application Deadline",
    "Spring Week Interview", "CV Drop-in Session", "Email my Tutor",
    "Sort out Student Finance", "Pay Rent",
    "Renew Railcard", "Book Dentist",
    "GP Appointment", "Laundry (overdue)", "Deep Clean the Kitchen",
    "IKEA Trip with Mia", "Inpost parcel return", "Group project meeting",
    "Do mock exam", "Review notes",
    "Study at Maughan Library", "Bush House Lab Session", "King's Sport Gym Session",
    "KCLSU Basketball Event", "Revision at FWB with friends", "Somerset House Visit",
    "KCL Careers Fair Prep", "King's Volunteering Shift",
    "KEATS Coursework Submission", "Denmark Hill Placement", "St Thomas Hospital Visit",
    "KCL Research Seminar", "Strand Roof Terrace Break", "KCL Mental Health Workshop",
    "Rise and Shine", "Morning Stretch", "Take a Shower",
    "Have a coffee", "Make Breakfast", "Bike to Campus",
    "Walk to the Strand", "Call Mum", "Call Dad",
    "Call Linda", "Call Jake", "Text the group chat",
    "Go to Dentist", "Pick up prescription", "Haircut at the barber",
    "Evening walk along the Thames", "Sunset run by Waterloo Bridge",
    "Meditate before bed", "Wind-down reading", "Plan tomorrow",
    "Journal entry", "Tidy desk before sleep", "Pack bag for tomorrow",
    "Reply to emails", "Check KEATS announcements", "Quick 20-min power nap",
    "Stretch after sitting", "Grab lunch from Pret", "Bring in bins",
    "Water the plants", "Order weekly shop", "Track spending this week",
    "Book train home", "Drop off parcel at InPost",
)

# ── Meal fixtures ─────────────────────────────────────────────────────────────
# Used by build_meal_events() to seed daily breakfast/lunch/dinner events.
# Each list rotates by day index so no two consecutive days are identical.

breakfast_fixtures = (
    "Porridge with banana and honey",
    "Scrambled eggs on toast",
    "Overnight oats with berries",
    "Avocado toast with a poached egg",
    "Granola with yoghurt",
    "Weetabix with oat milk",
    "Peanut butter on wholegrain toast",
    "Pancakes with maple syrup",
    "Greek yoghurt with honey and walnuts",
    "Boiled eggs and soldiers",
    "Cereal and a coffee",
    "Smoothie and a banana",
    "French toast with cinnamon",
)

lunch_fixtures = (
    "Meal Prep: rice and chicken",
    "Pret wrap and a coffee",
    "Leftover pasta from last night",
    "Tuna salad sandwich",
    "Chicken and avocado flatbread",
    "Soup and a bread roll",
    "Sushi from M&S",
    "Stir fry noodles",
    "Hummus and pitta with veg",
    "Jacket potato with beans",
    "Falafel wrap from the stall",
    "Pho from the Vietnamese place",
    "Cheese and tomato toastie",
    "Rice bowl with teriyaki salmon",
)

dinner_fixtures = (
    "Pasta with tomato and basil",
    "Chicken stir fry with noodles",
    "Homemade curry and rice",
    "Spaghetti bolognese",
    "Grilled salmon with sweet potato",
    "Shakshuka and bread",
    "Tacos with refried beans",
    "Oven roasted veg and halloumi",
    "Dhal with basmati rice",
    "Mac and cheese (comfort meal)",
    "Homemade pizza night",
    "Chicken katsu curry",
    "Veggie chilli with rice",
    "Thai green curry",
    "Lentil soup with crusty bread",
    "Steak and chips",
    "Baked aubergine parmigiana",
)

# ── Event descriptions ────────────────────────────────────────────────────────
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

# ── Locations ─────────────────────────────────────────────────────────────────
location_fixtures = (
    "Bush House, Strand, London WC2B 4PJ",
    "Maughan Library, Chancery Lane, London WC2A 1LR",
    "Franklin-Wilkins Building, 150 Stamford St, London SE1 9NH",
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

lecture_theatre_fixtures = (
    "Bush House Auditorium BH (N) 0, Strand Campus",
    "Waterloo FWB B5, Waterloo Campus",
    "Edmond J. Safra Lecture Theatre, Strand Campus",
    "New Hunt's House Lecture Theatre 1, Guy's Campus",
    "IET Kelvin Lecture Theatre",
    "Harris Lecture Theatre, Strand, Denmark Hill Campus",
    "Nevin Lecture Theatre, Guy's Campus",
    "Wolfson Lecture Theatre, St Thomas Campus",
)

# ── Modules ───────────────────────────────────────────────────────────────────
# Format: (module_code, module_name, description)
module_fixtures = (
    # ── Computer Science ──────────────────────────────────────────────────────
    ("CS4101", "Introduction to Programming", "Fundamentals of programming using Python. Covers variables, loops, functions and data structures."),
    ("CS4202", "Data Structures & Algorithms", "Core algorithms and data structures including trees, graphs, sorting and searching."),
    ("CS4303", "Software Engineering", "Software development lifecycle, agile methods, version control and team project work."),
    ("CS4404", "Databases & Information Systems", "Relational databases, SQL, data modelling and information retrieval."),

    # ── Artificial Intelligence ───────────────────────────────────────────────
    ("AI4101", "Machine Learning Fundamentals", "Supervised and unsupervised learning, neural networks, and model evaluation."),
    ("AI4202", "Natural Language Processing", "Text processing, language models, sentiment analysis and sequence modelling."),

    # ── Electronic Engineering ────────────────────────────────────────────────
    ("EE4101", "Circuit Theory & Electronics", "Fundamentals of electrical circuits, components, and electronic systems."),
    ("EE4202", "Digital Systems & Logic Design", "Boolean algebra, logic gates, combinational and sequential digital circuits."),
    ("EE4303", "Signals & Systems", "Signal processing, Fourier transforms, filtering and communication systems."),

    # ── General Engineering (GN prefix used cross-departmentally) ─────────────
    ("GN4101", "Engineering Mathematics", "Mathematical methods for engineers including calculus, ODEs and linear algebra."),
    ("GN4202", "Engineering Design & Materials", "Design principles, material properties, manufacturing processes and sustainability."),
    ("GN4303", "Thermodynamics & Fluid Mechanics", "Energy, heat transfer, fluid behaviour and engineering applications."),

    # ── Mathematics ───────────────────────────────────────────────────────────
    ("MA4101", "Calculus I", "Differential and integral calculus. Limits, derivatives, integrals and applications."),
    ("MA4202", "Linear Algebra", "Vectors, matrices, linear transformations, eigenvalues and eigenvectors."),
    ("MA4303", "Probability & Statistics", "Probability theory, distributions, hypothesis testing and statistical inference."),
    ("MA4404", "Real Analysis", "Sequences, series, continuity, differentiation and integration on the real line."),

    # ── Physics ───────────────────────────────────────────────────────────────
    ("PH4101", "Classical Mechanics", "Newtonian mechanics, energy, momentum, rotational motion and oscillations."),
    ("PH4202", "Electromagnetism", "Electric and magnetic fields, Maxwell's equations and electromagnetic waves."),
    ("PH4303", "Quantum Mechanics", "Wave-particle duality, Schrödinger equation, and quantum states."),

    # ── Life Sciences / Medicine / Biomedical ─────────────────────────────────
    ("LS4101", "Cell Biology", "Cell structure, function, division and molecular biology fundamentals."),
    ("LS4202", "Biochemistry Foundations", "Proteins, enzymes, metabolism and molecular interactions in living systems."),
    ("LS4303", "Human Anatomy", "Structure and function of the human body systems."),
    ("LS4404", "Physiology", "Mechanisms of body function including cardiovascular, respiratory and renal systems."),

    # ── Law ───────────────────────────────────────────────────────────────────
    ("LW4101", "Contract Law", "Formation and enforcement of contracts, offer and acceptance, consideration and breach."),
    ("LW4202", "Constitutional Law", "UK constitutional principles, parliamentary sovereignty and human rights law."),
    ("LW4303", "Criminal Law", "Principles of criminal liability, offences against the person and defences."),

    # ── Psychology / Neuroscience ─────────────────────────────────────────────
    ("PS4101", "Introduction to Psychology", "Cognitive, social and developmental psychology. Research methods and key theories."),
    ("PS4202", "Cognitive Neuroscience", "Neural basis of perception, memory, attention and decision-making."),
    ("PS4303", "Research Methods in Psychology", "Experimental design, statistics and ethics in psychological research."),

    # ── Business / Economics (BM and EC prefixes used interchangeably) ─────────
    ("BM4101", "Business Strategy", "Strategic analysis, competitive advantage, market positioning and case studies."),
    ("BM4202", "Accounting & Finance", "Financial statements, budgeting, investment appraisal and management accounting."),
    ("EC4101", "Microeconomics", "Supply and demand, market structures, consumer theory and welfare economics."),
    ("EC4202", "Macroeconomics", "GDP, inflation, unemployment, monetary policy and international trade."),

    # ── History ───────────────────────────────────────────────────────────────
    ("HI4101", "Modern British History", "British political and social history from 1850 to the present day."),
    ("HI4202", "European History 1914-1945", "The causes and consequences of the First and Second World Wars."),
    ("HI4303", "Global History", "Colonialism, decolonisation and the making of the modern world."),

    # ── English Literature & Philosophy ───────────────────────────────────────
    ("EN4101", "Literary Theory", "Critical frameworks for reading literature including structuralism, post-colonialism and feminism."),
    ("EN4202", "Modern Fiction", "Close reading of 20th and 21st century novels and short stories."),
    ("PL4101", "Ethics & Political Philosophy", "Justice, rights, liberty and the foundations of political authority."),
    ("PL4202", "Philosophy of Mind", "Consciousness, mental representation, and the mind-body problem."),

    # ── Social Science ────────────────────────────────────────────────────────
    ("GE4101", "Human Geography", "Urbanisation, migration, globalisation and spatial inequality."),
    ("PO4101", "Introduction to Politics", "Political institutions, ideologies, and comparative government."),
    ("IR4101", "International Relations Theory", "Realism, liberalism, constructivism and the structure of world politics."),

    # ── Nursing (10 modules covering full degree arc) ─────────────────────────
    ("NU4101", "Foundations of Nursing Practice", "Patient care principles, clinical skills and professional ethics."),
    ("NU4102", "Anatomy & Physiology for Nurses", "Body systems and their functions with a focus on clinical application."),
    ("NU4203", "Mental Health Nursing", "Therapeutic communication, mental health assessment and care planning."),
    ("NU4204", "Adult Nursing in Acute Settings", "Managing patients in high-dependency and emergency care environments."),
    ("NU4205", "Child and Family Nursing", "Paediatric care principles, family-centred nursing and safeguarding."),
    ("NU4206", "Pharmacology for Nursing Practice", "Drug classifications, dosage calculations and safe administration."),
    ("NU4307", "Long-Term Conditions and Chronic Care", "Managing patients with diabetes, COPD, heart failure and other chronic illnesses."),
    ("NU4308", "Evidence-Based Practice and Research", "Critical appraisal of research, clinical guidelines and quality improvement."),
    ("NU4309", "Leadership and Management in Nursing", "Team leadership, delegation, NHS management structures and professional development."),
    ("NU4410", "District and Community Nursing", "Home visiting, palliative care, public health and community-based practice."),

    # ── Dentistry ─────────────────────────────────────────────────────────────
    ("DE4101", "Oral Biology", "Structure and function of teeth, supporting tissues and oral health."),

    # ── Modern Languages
    # Each language pair covers introductory and intermediate levels;
    # courses go beyond grammar with literature, film, and culture embedded
    # from the second module onward.
    ("FR4101", "French Language I", "Introductory French: core grammar, practical speaking, listening and reading skills."),
    ("FR4202", "French Language II", "Intermediate French: journalism, short fiction, grammar consolidation and conversation."),
    ("FR4303", "French Cinema and Culture", "Nouvelle Vague to contemporary French cinema, conducted in French."),
    ("FR4404", "Advanced French: Literature and Society", "Sartre, Beauvoir, Senghor and modern French social debates."),

    ("SP4101", "Spanish Language I", "Introductory Spanish: core grammar, vocabulary and everyday communication."),
    ("SP4202", "Spanish Language II", "Intermediate Spanish: cultural contexts, regional variation and advanced conversation."),
    ("SP4303", "Latin American Literature and Identity", "García Márquez, Luiselli, magical realism and postcolonial identity."),
    ("SP4404", "Spanish in the Contemporary World", "Politics, media, activism and the global reach of the Spanish language."),

    ("GL4101", "German Language I", "Introductory German: pronunciation, grammar foundations and practical communication."),
    ("GL4202", "German Language II", "Intermediate German: cultural and historical texts, reading and conversation."),
    ("GL4303", "German History Through Language", "Weimar Republic, Third Reich and reunification through primary sources."),
    ("GL4404", "Contemporary German Society", "Migration, identity politics and modern Germany in text and media."),

    ("AR4101", "Arabic Language I", "Modern Standard Arabic: script, pronunciation, grammar and basic conversation."),
    ("AR4202", "Arabic Language II", "Intermediate MSA with introduction to dialectal variation."),
    ("AR4303", "Arabic Media and Politics", "News broadcasts, speeches and social media in Arabic."),

    ("ZH4101", "Mandarin Chinese I", "Introduction to Mandarin: pinyin, tones, foundational characters and expressions."),
    ("ZH4202", "Mandarin Chinese II", "Character recognition, conversational fluency and written communication."),
    ("ZH4303", "Chinese Society and Culture", "Contemporary China through film, literature and media."),

    ("IT4101", "Italian Language I", "Core Italian grammar, conversational skills and cultural introduction."),
    ("IT4202", "Italian Language II", "Intermediate Italian: literature, current affairs and advanced conversation."),

    ("PT4101", "Portuguese Language I", "Brazilian Portuguese grammar foundations and everyday communication."),
    ("PT4202", "Portuguese and Lusophone Cultures", "Literature and culture of Brazil, Portugal, Angola and Mozambique."),

    # ── Arts ──────────────────────────────────────────────────────────────────
    ("FA4101", "History of Art", "Survey of Western art from the Renaissance to the contemporary period."),
    ("FA4202", "Contemporary Art & Theory", "Critical frameworks for understanding art since 1960."),
    ("TH4101", "Introduction to Theatre Studies", "Performance theory, dramatic texts and the history of theatre."),
    ("MU4101", "Music History", "Western classical music from Bach to the 20th century."),
    ("MU4202", "Music Theory", "Notation, harmony, counterpoint and compositional techniques."),
    ("CL4101", "Classical Studies", "Greek and Roman literature, history and culture in translation."),
    ("CR4101", "Creative Writing", "Fiction, poetry and non-fiction workshops with peer critique."),
)

# ── Courses ───────────────────────────────────────────────────────────────────
course_fixtures = (
    "Computer Science", "Artificial Intelligence", "Mathematics", "Physics", "Chemistry",
    "Law", "Medicine", "Biomedical Science", "Neuroscience", "Psychology", "Nursing",
    "Business Management", "Economics", "Politics", "History", "English Literature",
    "Philosophy", "Film Studies", "Dentistry", "Geography", "International Relations",
    "French", "Spanish", "German", "Modern Languages", "Music", "Classical Studies",
)

# ── Course → module prefix mapping ───────────────────────────────────────────
course_to_module_prefixes = {
    "Computer Science": ["CS"],
    "Computer Science with Management": ["CS", "BM"],
    "Artificial Intelligence": ["CS", "AI"],
    "Mathematics": ["MA"],
    "Physics": ["PH", "MA"],
    "Electronic Engineering": ["EE", "PH", "MA"],
    "General Engineering": ["GN", "PH", "MA"],
    "Chemistry": ["PH", "LS"],
    "Medicine": ["LS"],
    "Biomedical Science": ["LS"],
    "Neuroscience": ["LS", "PS"],
    "Psychology": ["PS"],
    "Midwifery": ["NU"],
    "Nursing": ["NU", "LS"],
    "Dentistry": ["DE"],
    "Law": ["LW"],
    "Business Management": ["BM", "EC"],
    "Accounting & Finance": ["BM", "EC"],
    "Economics": ["EC", "BM"],
    "International Management": ["BM", "EC"],
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
}

# ── Module prefix → faculty department ───────────────────────────────────────
module_prefix_to_department = {
    "CS": "Natural, Mathematical & Engineering Sciences",
    "AI": "Natural, Mathematical & Engineering Sciences",
    "MA": "Natural, Mathematical & Engineering Sciences",
    "PH": "Natural, Mathematical & Engineering Sciences",
    "EE": "Natural, Mathematical & Engineering Sciences",
    "GN": "Natural, Mathematical & Engineering Sciences",
    "LS": "Life Sciences & Medicine",
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
    "FA": "Arts & Humanities",
    "TH": "Arts & Humanities",
    "MU": "Arts & Humanities",
    "CL": "Arts & Humanities",
    "CR": "Arts & Humanities",
}

# ── Deadline fixtures ─────────────────────────────────────────────────────────
# Format: (deadline_type, title, description)
# Generic fallback used when a module prefix has no specific entry below.
deadline_fixtures = (
    ("coursework", "Coursework 1", "Submit via KEATS by the deadline. Check the module page for submission instructions."),
    ("coursework", "Coursework 2", "Worth 50 marks, assessing weeks 1–5. Full brief available on KEATS."),
    ("quiz", "Multiple Choice Quiz", "Short online quiz on KEATS covering recent lecture topics."),
    ("exam", "Final Exam", "Final exam covering the entire module. Good luck!"),
    ("presentation", "Group Presentation", "Group presentation in class, at least 15 mins. Slides to be uploaded to KEATS."),
)

# Maps specific deadlines to modules via module code prefix.
# Format: (deadline_type, title, description)
module_deadline_fixtures = {
    "CS": [
        ("coursework", "Programming Project", "Create a Time Management System for students. Submit code and report via KEATS."),
        ("exam", "Final exam", "Closed-book written exam covering all lecture materials."),
        ("quiz", "KEATS Quiz", "5 questions to help revise material over reading week."),
    ],
    "AI": [
        ("coursework", "Programming Project", "Evaluate a machine learning model of your choice. Submit evaluation via KEATS."),
        ("exam", "Final Exam", "Computer exam covering all topics. Derivations and conceptual questions included."),
        ("quiz", "KEATS Quiz", "5 questions to help revise material over reading week."),
    ],
    "MA": [
        ("coursework", "Practice Problems", "Complete all questions from the assignment. Submit online for automatic feedback."),
        ("exam", "Final exam", "In-person written exam. No calculators unless specified."),
        ("exam", "Final exam", "Closed book exam with formula sheet provided."),
    ],
    "PH": [
        ("coursework", "Lab report", "Write up your laboratory experiment. Include data, error analysis and conclusions."),
        ("exam", "Final exam", "Closed-book written exam. Covers the full module and includes formulas."),
    ],
    "EE": [
        ("coursework", "Lab Report", "Document your lab experiment. Include circuit diagram measurements. Submit via KEATS."),
        ("exam", "Final exam", "Open-book written exam with data sheet. Check KEATS for allowed materials."),
    ],
    "GN": [
        ("coursework", "Design Portfolio", "Detailed portfolio of all design work. Include sketches and calculations."),
        ("exam", "Final exam", "Comprehensive exam. Check KEATS for room allocation."),
    ],
    "LS": [
        ("coursework", "Individual Lab Report", "Write up your practical session. Include methodology and data analysis."),
        ("exam", "Reading Week Exam", "Multiple choice and short answer questions covering weeks 1–5."),
        ("quiz", "KEATS Quiz", "15 questions assessing your understanding of the module so far."),
    ],
    "LW": [
        ("coursework", "Legal Essay", "Critical legal essay on your assigned question. 1500 words."),
        ("exam", "Final exam", "Open-book written exam. No annotations permitted."),
        ("presentation", "Class Presentation", "Oral advocacy exercise. Prepare legal arguments for your view of the problem."),
    ],
    "PS": [
        ("coursework", "Research Report", "Write up your research study in the discussed format. Submit through KEATS."),
        ("exam", "Final exam", "Closed-book written exam with essay questions."),
    ],
    "BM": [
        ("coursework", "Business Case Study", "Analyse your assigned company. 2500 words."),
        ("exam", "Final exam", "Closed-book written exam with case study and essay questions."),
        ("presentation", "Pitch Presentation", "Present your business proposal to a panel. 15 minutes plus Q&A."),
    ],
    "EC": [
        ("coursework", "Economics Essay", "Analytical essay applying economic theory to a real-world issue. 2000 words."),
        ("exam", "Mid-Term Exam", "Written exam with data response and short answer questions covering weeks 1–5."),
        ("exam", "Final exam", "Closed-book exam covering the full module syllabus."),
    ],
    "HI": [
        ("coursework", "Essay", "Historical essay on your assigned question. 2500 words. Chicago footnote referencing."),
        ("exam", "Final exam", "Unseen written exam. Two essay questions from a choice of six."),
    ],
    "EN": [
        ("coursework", "Essay", "Critical essay on the module texts. 2500 words. MLA referencing required."),
        ("exam", "Final exam", "Unseen written exam. Essay questions on set texts and themes from the module."),
        ("presentation", "Seminar Presentation", "Lead a 15-minute seminar discussion on your assigned text or topic."),
    ],
    "PL": [
        ("coursework", "Philosophy Essay", "Argumentative essay defending your assigned philosophical position. 2000 words."),
        ("exam", "Final exam", "Closed-book written exam. Two extended essay questions from a choice of five."),
    ],
    "PO": [
        ("coursework", "Policy Brief", "1500-word policy brief on your assigned political issue. Clear recommendations required."),
        ("exam", "Final exam", "Closed-book written exam. Two essay questions from a choice of six."),
    ],
    "IR": [
        ("coursework", "Essay", "Analytical essay applying IR theory to a current international issue. 2500 words."),
        ("exam", "Final exam", "Closed-book exam. Two essay questions covering all theories and case studies."),
    ],
    "NU": [
        ("coursework", "Reflective Practice Portfolio", "Document and reflect on clinical placements using the Gibbs Reflective Cycle."),
        ("exam", "Final exam", "Written exam with clinical scenario and short answer questions."),
    ],
    "DE": [
        ("coursework", "Clinical Case Report", "Document a patient case including diagnosis and treatment plan. 1500 words."),
        ("exam", "Final exam", "Written exam covering biology content. Multiple choice and extended answer questions."),
    ],
    "FR": [
        ("coursework", "Written Assignment", "French essay or translation exercise as specified on KEATS."),
        ("exam", "Written Exam", "Formal written exam including grammar, translation and essay components."),
    ],
    "SP": [
        ("coursework", "Written Assignment", "Spanish written exercise as specified on KEATS. Focus on grammar accuracy."),
        ("exam", "Written Exam", "Formal exam with grammar, translation and essay sections."),
    ],
    "GL": [
        ("coursework", "Written Assignment", "German written exercise submitted via KEATS. Grammar and vocabulary assessed."),
        ("exam", "Written Exam", "Formal written exam with grammar, reading comprehension and essay questions."),
    ],
    "AR": [
        ("coursework", "Written Assignment", "Arabic written exercise submitted via KEATS."),
        ("exam", "Written Exam", "Formal written exam with grammar, translation and reading comprehension."),
    ],
    "ZH": [
        ("coursework", "Written Assignment", "Mandarin written exercise submitted via KEATS."),
        ("exam", "Written Exam", "Formal written exam with character recognition and translation components."),
    ],
}