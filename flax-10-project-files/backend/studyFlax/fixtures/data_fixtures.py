from zoneinfo import ZoneInfo
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

# Event descriptions
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

# Locations
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
    "The Shard",
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

# Modules
# Format: (module_code, module_name, description)
module_fixtures = (
    # Computer Science
    ("CS4101", "Introduction to Programming", "Fundamentals of programming using Python. Covers variables, loops, functions and data structures."),
    ("CS4202", "Data Structures & Algorithms", "Core algorithms and data structures including trees, graphs, sorting and searching."),
    ("CS4303", "Software Engineering", "Software development lifecycle, agile methods, version control and team project work."),
    ("CS4404", "Databases & Information Systems", "Relational databases, SQL, data modelling and information retrieval."),

    # Artificial Intelligence
    ("AI4101", "Machine Learning Fundamentals", "Supervised and unsupervised learning, neural networks, and model evaluation."),
    ("AI4202", "Natural Language Processing", "Text processing, language models, sentiment analysis and sequence modelling."),

    # Electronic Engineering
    ("EE4101", "Circuit Theory & Electronics", "Fundamentals of electrical circuits, components, and electronic systems."),
    ("EE4202", "Digital Systems & Logic Design", "Boolean algebra, logic gates, combinational and sequential digital circuits."),
    ("EE4303", "Signals & Systems", "Signal processing, Fourier transforms, filtering and communication systems."),

    # General Engineering
    ("GN4101", "Engineering Mathematics", "Mathematical methods for engineers including calculus, ODEs and linear algebra."),
    ("GN4202", "Engineering Design & Materials", "Design principles, material properties, manufacturing processes and sustainability."),
    ("GN4303", "Thermodynamics & Fluid Mechanics", "Energy, heat transfer, fluid behaviour and engineering applications."),

    # Mathematics
    ("MA4101", "Calculus I", "Differential and integral calculus. Limits, derivatives, integrals and applications."),
    ("MA4202", "Linear Algebra", "Vectors, matrices, linear transformations, eigenvalues and eigenvectors."),
    ("MA4303", "Probability & Statistics", "Probability theory, distributions, hypothesis testing and statistical inference."),
    ("MA4404", "Real Analysis", "Sequences, series, continuity, differentiation and integration on the real line."),

    # Physics 
    ("PH4101", "Classical Mechanics", "Newtonian mechanics, energy, momentum, rotational motion and oscillations."),
    ("PH4202", "Electromagnetism", "Electric and magnetic fields, Maxwell's equations and electromagnetic waves."),
    ("PH4303", "Quantum Mechanics", "Wave-particle duality, Schrödinger equation, and quantum states."),

    # Life Sciences / Medicine / Biomedical 
    ("LS4101", "Cell Biology", "Cell structure, function, division and molecular biology fundamentals."),
    ("LS4202", "Biochemistry Foundations", "Proteins, enzymes, metabolism and molecular interactions in living systems."),
    ("LS4303", "Human Anatomy", "Structure and function of the human body systems."),
    ("LS4404", "Physiology", "Mechanisms of body function including cardiovascular, respiratory and renal systems."),

    #Law
    ("LW4101", "Contract Law", "Formation and enforcement of contracts, offer and acceptance, consideration and breach."),
    ("LW4202", "Constitutional Law", "UK constitutional principles, parliamentary sovereignty and human rights law."),
    ("LW4303", "Criminal Law", "Principles of criminal liability, offences against the person and defences."),

    # Psychology / Neuroscience
    ("PS4101", "Introduction to Psychology", "Cognitive, social and developmental psychology. Research methods and key theories."),
    ("PS4202", "Cognitive Neuroscience", "Neural basis of perception, memory, attention and decision-making."),
    ("PS4303", "Research Methods in Psychology", "Experimental design, statistics and ethics in psychological research."),

    #  Business / Economics 
    ("BM4101", "Business Strategy", "Strategic analysis, competitive advantage, market positioning and case studies."),
    ("BM4202", "Accounting & Finance", "Financial statements, budgeting, investment appraisal and management accounting."),
    ("EC4101", "Microeconomics", "Supply and demand, market structures, consumer theory and welfare economics."),
    ("EC4202", "Macroeconomics", "GDP, inflation, unemployment, monetary policy and international trade."),

    # History 
    ("HI4101", "Modern British History", "British political and social history from 1850 to the present day."),
    ("HI4202", "European History 1914-1945", "The causes and consequences of the First and Second World Wars."),
    ("HI4303", "Global History", "Colonialism, decolonisation and the making of the modern world."),

    # English Literature & Philosophy 
    ("EN4101", "Literary Theory", "Critical frameworks for reading literature including structuralism, post-colonialism and feminism."),
    ("EN4202", "Modern Fiction", "Close reading of 20th and 21st century novels and short stories."),
    ("PL4101", "Ethics & Political Philosophy", "Justice, rights, liberty and the foundations of political authority."),
    ("PL4202", "Philosophy of Mind", "Consciousness, mental representation, and the mind-body problem."),

    # Social Science 
    ("GE4101", "Human Geography", "Urbanisation, migration, globalisation and spatial inequality."),
    ("PO4101", "Introduction to Politics", "Political institutions, ideologies, and comparative government."),
    ("IR4101", "International Relations Theory", "Realism, liberalism, constructivism and the structure of world politics."),

    # Nursing 
    ("NU4101", "Foundations of Nursing Practice", "Patient care principles, clinical skills and professional ethics."),
    ("NU4102", "Anatomy & Physiology for Nurses", "Body systems and their functions with a focus on clinical application."),
    ("NU4203", "Mental Health Nursing", "Therapeutic communication, mental health assessment and care planning."),
    ("NU4204", "Adult Nursing in Acute Settings", "Managing patients in high-dependency and emergency care environments."),
    ("NU4205", "Child and Family Nursing", "Paediatric care principles, family-centred nursing and safeguarding."),

    # Dentistry 
    ("DE4101", "Oral Biology", "Structure and function of teeth, supporting tissues and oral health."),

    # Modern Languages
    ("FR4101", "French Language I", "Introductory French: core grammar, practical speaking, listening and reading skills."),

    ("SP4303", "Latin American Literature and Identity", "García Márquez, Luiselli, magical realism and postcolonial identity."),
    ("SP4404", "Spanish in the Contemporary World", "Politics, media, activism and the global reach of the Spanish language."),

    ("GL4101", "German Language I", "Introductory German: pronunciation, grammar foundations and practical communication."),
    ("GL4303", "German History Through Language", "Weimar Republic, Third Reich and reunification through primary sources."),
    ("GL4404", "Contemporary German Society", "Migration, identity politics and modern Germany in text and media."),

    ("AR4303", "Arabic Media and Politics", "News broadcasts, speeches and social media in Arabic."),
    ("ZH4303", "Chinese Society and Culture", "Contemporary China through film, literature and media."),
    ("IT4101", "Italian Language I", "Core Italian grammar, conversational skills and cultural introduction."),
    ("PT4101", "Portuguese Language I", "Brazilian Portuguese grammar foundations and everyday communication."),

    # Arts 
    ("FA4101", "History of Art", "Survey of Western art from the Renaissance to the contemporary period."),
    ("FA4202", "Contemporary Art & Theory", "Critical frameworks for understanding art since 1960."),
    ("TH4101", "Introduction to Theatre Studies", "Performance theory, dramatic texts and the history of theatre."),
    ("MU4101", "Music History", "Western classical music from Bach to the 20th century."),
    ("MU4202", "Music Theory", "Notation, harmony, counterpoint and compositional techniques."),
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

# Society seed data with related events
society_seed_data = [
    {
        'name': 'Tech Society',
        'bio': 'Passionate about technology and innovation.',
        'about': 'We host hackathons, workshops, and networking events for tech enthusiasts.\nAdmin: johndoe@gmail.com',
        'image': 'http://localhost:8000/static/seed_images/societies/tech.jpg',
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
        'about': 'A community for artists to share ideas and work on collaborative projects.\nAdmin: johndoe@gmail.com',
        'image': 'http://localhost:8000/static/seed_images/societies/art.jpg',
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
        'about': 'Weekly photo walks and exhibitions to showcase student photography.\nAdmin: johndoe@gmail.com',
        'image': 'http://localhost:8000/static/seed_images/societies/photography.jpg',
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
        'about': 'Join us for weekly board game nights and tournaments.\nAdmin: johndoe@gmail.com',
        'image': 'http://localhost:8000/static/seed_images/societies/boardgames.jpg',
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
        'about': 'Book club discussions and writing workshops for literature lovers.\nAdmin: johndoe@gmail.com',
        'image': 'http://localhost:8000/static/seed_images/societies/literature.jpg',
        'tags': ['Book Club', 'Workshop', 'Reading'],
        'events': [
            {'title': 'Monthly Book Club', 'description': "Discussing this month's pick."},
            {'title': 'Creative Writing Workshop', 'description': 'Develop your writing skills.'},
            {'title': 'Poetry Open Mic', 'description': 'Share your poems or just listen.'},
            {'title': 'Author Talk', 'description': 'Guest speaker and book signing.'},
        ],
    },
]
# Deadline fixtures
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
        ("coursework", "Programming Assignment 1", "Individual coding assignment submitted via KEATS. Include a README and ensure your code runs cleanly. Zip your repo before submitting."),
        ("coursework", "Group Software Project Submission", "Final codebase and written report for your team project. Submit via KEATS by 23:59. Include test coverage and a developer guide."),
        ("exam", "Summer Term Exam", "Closed-book written exam held at Bush House or Strand campus. Bring your KCL student ID. Check your timetable on KEATS for room allocation."),
        ("quiz", "Weekly KEATS Quiz", "Formative quiz on KEATS covering recent lecture content. Not graded but strongly recommended for exam preparation."),
    ],
    "AI": [
        ("coursework", "Machine Learning Experiment Report", "Implement and evaluate a supervised learning model on a provided dataset. Submit a Jupyter notebook and 1500-word report via KEATS."),
        ("coursework", "Group Deep Learning Project", "Group project building and evaluating a neural network. Submit code, trained model weights, and a written evaluation. KEATS submission only."),
        ("exam", "Summer Term Exam", "Computer-based exam at a KCL lab. Covers all lecture content including derivations and practical implementation questions. Check KEATS for room."),
        ("quiz", "KEATS Formative Quiz", "Short quiz to help you consolidate recent material. Results visible immediately on KEATS."),
    ],
    "MA": [
        ("coursework", "Problem Sheet 1", "Complete all questions and submit a neat, handwritten or typed solution via KEATS. Marks awarded for method as well as correct answers."),
        ("coursework", "Problem Sheet 2", "Second assessed problem sheet. Covers material from weeks 4–7. Submit via KEATS by 23:59 on the due date."),
        ("exam", "January In-Class Test", "50-minute written test held in your lecture slot. Covers weeks 1–5. No calculators unless stated on KEATS."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Formula sheet provided where applicable. Check KEATS for permitted materials and room allocation."),
    ],
    "PH": [
        ("coursework", "Lab Report 1", "Write up your first lab experiment following the standard KCL lab report format. Include raw data, error analysis, and conclusions. Submit via KEATS."),
        ("coursework", "Lab Report 2", "Second lab write-up. Focus on uncertainty propagation and comparison to theoretical values. Submit via KEATS."),
        ("exam", "Summer Term Exam", "Closed-book written exam with formula sheet provided. Held at Strand or Bush House campus. Bring student ID."),
    ],
    "EE": [
        ("coursework", "Circuit Design Lab Report", "Document your circuit design lab. Include annotated circuit diagrams, oscilloscope screenshots, and measured vs theoretical values. Submit via KEATS."),
        ("coursework", "Arduino Project Report", "Report on your embedded systems project. Include code listing, wiring diagrams, and a short video demo link. Submit ZIP via KEATS."),
        ("exam", "Summer Term Exam", "Open-book written exam. Approved data sheets only — no annotated notes. Check KEATS for the permitted materials list and room."),
    ],
    "GN": [
        ("coursework", "Design Portfolio", "Full portfolio of design work including concept sketches, CAD drawings, material justification, and cost estimates. Submit PDF via KEATS."),
        ("presentation", "Design Review Presentation", "10-minute group presentation of your design concept to a panel. Q&A follows. Slides to be uploaded to KEATS by 09:00 on the day."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Covers thermodynamics, materials, and engineering mathematics. Formula sheet provided. Check KEATS for room."),
    ],
    "LS": [
        ("coursework", "Lab Practical Report", "Full write-up of your laboratory session. Use the standard scientific report format: introduction, methods, results, discussion. Submit via KEATS."),
        ("exam", "Reading Week Progress Test", "In-person multiple choice and short answer exam held during reading week. Covers weeks 1–5. Check KEATS for time and room allocation."),
        ("exam", "Summer Term Exam", "Closed-book written exam at Guy's or St Thomas' campus. Covers the full module syllabus. Bring student ID."),
        ("quiz", "KEATS Anatomy Quiz", "15-question formative quiz on KEATS. Covers diagrams and terminology from recent lectures. Recommended before your reading week test."),
    ],
    "LW": [
        ("coursework", "Legal Problem Question Essay", "1500-word essay answering an unseen problem question in the IRAC format. Submit via Turnitin on KEATS. OSCOLA footnote referencing required."),
        ("coursework", "Mooting Skeleton Argument", "Written skeleton argument for your moot problem. Max 5 pages. Submit to KEATS 48 hours before your moot session."),
        ("presentation", "Oral Mooting Exercise", "Formal oral advocacy assessment. You will argue a ground of appeal before a panel. Dress professionally. Preparation materials on KEATS."),
        ("exam", "Summer Term Exam", "Open-book written exam. No annotations or sticky tabs in materials. Two problem questions in 2 hours. Check KEATS for room."),
    ],
    "PS": [
        ("coursework", "Empirical Research Report", "Write up your lab study in APA format: abstract, introduction, methods, results, discussion. 2500 words. Submit via Turnitin on KEATS."),
        ("coursework", "Critical Literature Review", "2000-word critical review of three papers on your assigned topic. Use APA referencing. Submit via KEATS."),
        ("exam", "Summer Term Exam", "Closed-book written exam with two essay questions from a choice of four. 2 hours. Held at Strand campus."),
    ],
    "BM": [
        ("coursework", "Company Analysis Report", "2500-word strategic analysis of your assigned company using frameworks covered in lectures (e.g. PESTLE, Porter's Five Forces). Harvard referencing. Submit via Turnitin."),
        ("presentation", "Business Pitch Presentation", "10-minute group pitch followed by 5-minute Q&A from a panel of assessors. Slide deck to be submitted via KEATS the morning of your session."),
        ("exam", "Summer Term Exam", "Closed-book written exam with a case study and two essay questions. 2 hours. Held at Strand or Bush House campus."),
    ],
    "EC": [
        ("coursework", "Data Analysis Essay", "2000-word essay applying microeconomic or macroeconomic theory to a real-world policy issue. Include a data exhibit. Harvard referencing. Submit via Turnitin."),
        ("exam", "Mid-Term Progress Test", "50-minute in-class test held in your lecture slot. Data response and short answer questions covering weeks 1–5. Calculators permitted."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Covers the full module. Calculators permitted. Check KEATS for room allocation at Strand or Bush House."),
    ],
    "HI": [
        ("coursework", "Source Analysis", "1500-word critical analysis of a primary source provided on KEATS. Use Chicago footnote referencing. Submit via Turnitin."),
        ("coursework", "Extended Essay", "2500-word essay on a question from the list on KEATS. Demonstrate independent archival or historiographical research. Chicago referencing. Submit via Turnitin."),
        ("exam", "Summer Term Exam", "Unseen written exam. Two essays from a choice of six questions. 2 hours. Held at Strand campus. No materials permitted."),
    ],
    "EN": [
        ("coursework", "Close Reading Essay", "1500-word essay focused on a passage from a set text. Demonstrate close textual analysis. MLA referencing. Submit via Turnitin on KEATS."),
        ("coursework", "Extended Critical Essay", "2500-word essay engaging with secondary criticism and theoretical frameworks. MLA referencing. Submit via Turnitin."),
        ("presentation", "Seminar Presentation", "15-minute led discussion on your assigned text. Prepare discussion questions and a 1-page handout for peers. Upload slides to KEATS beforehand."),
        ("exam", "Summer Term Exam", "Unseen written exam. Two essay questions on set texts. 2 hours. Passage-based and thematic questions. Held at Strand campus."),
    ],
    "PL": [
        ("coursework", "Philosophical Essay", "2000-word argumentative essay on your assigned question. Engage with primary texts and at least two secondary sources. Harvard referencing. Submit via Turnitin."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Two extended essays from a choice of five. 2 hours. Held at Strand campus."),
    ],
    "PO": [
        ("coursework", "Policy Brief", "1500-word policy brief on an assigned political issue. Structured with an executive summary, analysis, and clear policy recommendations. Submit via KEATS."),
        ("coursework", "Comparative Politics Essay", "2000-word essay comparing political institutions or outcomes across two countries. Harvard referencing. Submit via Turnitin."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Two essay questions from a choice of six. 2 hours. Held at Strand campus."),
    ],
    "IR": [
        ("coursework", "Theory Application Essay", "2500-word essay applying an IR theory to a current international event or issue. Harvard referencing. Submit via Turnitin on KEATS."),
        ("exam", "Summer Term Exam", "Closed-book exam. Two essay questions covering theories and case studies from the module. 2 hours. Held at Strand campus."),
    ],
    "NU": [
        ("coursework", "Reflective Practice Portfolio", "Structured portfolio reflecting on three clinical placement experiences using the Gibbs Reflective Cycle. 2500 words total. Submit via KEATS."),
        ("coursework", "Care Plan Assignment", "Develop a person-centred care plan for a fictional patient scenario. Include clinical reasoning and NMC standards references. Submit via KEATS."),
        ("exam", "OSCE Clinical Skills Assessment", "Observed clinical examination at Guy's or Denmark Hill campus. Review clinical skills checklists on KEATS and attend the practice session beforehand."),
        ("exam", "Summer Term Written Exam", "Written exam with clinical scenario questions and short answers. Held at Guy's campus. Bring student ID."),
    ],
    "DE": [
        ("coursework", "Clinical Case Report", "1500-word case report documenting a patient presentation, diagnosis, and proposed treatment plan. Anonymised. Submit via KEATS."),
        ("coursework", "Oral Biology Lab Report", "Lab write-up covering histological analysis of dental tissues. Include labelled diagrams. Submit via KEATS."),
        ("exam", "Oral Biology Written Exam", "Written exam with multiple choice, short answer, and extended response sections. Held at Guy's campus. Covers full module content."),
    ],
    "FR": [
        ("coursework", "French Written Assignment", "Essay or translation exercise as specified on KEATS. Assessed on grammar accuracy, register, and vocabulary range. Submit via KEATS."),
        ("coursework", "Oral Presentation", "5-minute individual presentation in French on an assigned cultural or current affairs topic. Assessed on fluency and accuracy."),
        ("exam", "Written Language Exam", "Formal written exam including grammar exercises, a translation passage, and a 200-word essay in French. Held at Strand campus."),
    ],
    "SP": [
        ("coursework", "Spanish Written Assignment", "Essay or translation task as specified on KEATS. Assessed on grammar, vocabulary, and register. Submit via KEATS."),
        ("coursework", "Oral Assessment", "Individual 5-minute conversation in Spanish with an assessor on a topic from the module. Preparation materials on KEATS."),
        ("exam", "Written Language Exam", "Formal written exam with grammar, translation, and essay components in Spanish. Held at Strand campus."),
    ],
    "GL": [
        ("coursework", "German Written Assignment", "Translation or essay task in German submitted via KEATS. Assessed on grammatical accuracy and use of appropriate register."),
        ("coursework", "Oral Presentation", "5-minute individual presentation in German on a topic from the module. Feedback given in the session."),
        ("exam", "Written Language Exam", "Formal written exam covering grammar, reading comprehension, and a short essay in German. Held at Strand campus."),
    ],
    "AR": [
        ("coursework", "Arabic Written Assignment", "Translation or written exercise submitted via KEATS. Assessed on script accuracy, vocabulary, and grammar."),
        ("exam", "Written Language Exam", "Formal written exam with grammar, translation, and reading comprehension sections in Arabic. Held at Strand campus."),
    ],
    "ZH": [
        ("coursework", "Chinese Written Assignment", "Written exercise in Mandarin submitted via KEATS. Assessed on character accuracy, grammar, and range of expression."),
        ("exam", "Written Language Exam", "Formal written exam with character recognition, translation, and reading comprehension. Held at Strand campus."),
    ],
    "MU": [
        ("coursework", "Music Analysis Essay", "1500-word written analysis of a set score or recording. Use appropriate musical terminology and notation references. Submit via KEATS."),
        ("coursework", "Composition Portfolio", "Portfolio of original compositions with programme notes explaining compositional choices. Submit audio files and scores via KEATS."),
        ("exam", "Summer Term Exam", "Aural and written exam. Includes score-based questions and short essays. Held at Strand campus."),
    ],
    "FA": [
        ("coursework", "Visual Analysis Essay", "1500-word formal analysis of an assigned artwork. Attend the in-person session at Somerset House or the National Gallery if indicated on KEATS."),
        ("coursework", "Extended Research Essay", "2500-word essay situating an artwork or movement within its historical and theoretical context. Harvard referencing. Submit via Turnitin."),
        ("exam", "Summer Term Exam", "Unseen written exam with slide-based questions and essay responses. 2 hours. Held at Strand campus."),
    ],
}
