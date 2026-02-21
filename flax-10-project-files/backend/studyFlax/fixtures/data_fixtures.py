from zoneinfo import ZoneInfo

category_fixtures = (
    ('Work', '#FF5733', True),
    ('University', '#33FF57', True),
    ('Personal', '#3357FF', True),
    ('Chores', '#FF33A8', False),
    ('Social', '#A833FF', False),
    ('Health', '#33FFF5', False),
)

tag_fixtures = (
    ('Lecture', 120),
    ('Practical', 90),
    ('Study Session', 120),
    ('Meeting', 30),
    ('Gym', 60),
    ('Grocery Shopping', 45),
    ('Assignment Deadline', 0),
)

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

    # Life Sciences 
    ("LS4101", "Cell Biology", "Cell structure, function, division and molecular biology fundamentals."),
    ("LS4202", "Biochemistry Foundations", "Proteins, enzymes, metabolism and molecular interactions in living systems."),
    ("LS4303", "Human Anatomy", "Structure and function of the human body systems."),
    ("LS4404", "Physiology", "Mechanisms of body function including cardiovascular, respiratory and renal systems."),

    # Law
    ("LW4101", "Contract Law", "Formation and enforcement of contracts, offer and acceptance, consideration and breach."),
    ("LW4202", "Constitutional Law", "UK constitutional principles, parliamentary sovereignty and human rights law."),
    ("LW4303", "Criminal Law", "Principles of criminal liability, offences against the person and defences."),

    # Psychology and Neuroscience
    ("PS4101", "Introduction to Psychology", "Cognitive, social and developmental psychology. Research methods and key theories."),
    ("PS4202", "Cognitive Neuroscience", "Neural basis of perception, memory, attention and decision-making."),
    ("PS4303", "Research Methods in Psychology", "Experimental design, statistics and ethics in psychological research."),

    # Business and Economics
    ("BM4101", "Business Strategy", "Strategic analysis, competitive advantage, market positioning and case studies."),
    ("BM4202", "Accounting & Finance", "Financial statements, budgeting, investment appraisal and management accounting."),
    ("EC4101", "Microeconomics", "Supply and demand, market structures, consumer theory and welfare economics."),
    ("EC4202", "Macroeconomics", "GDP, inflation, unemployment, monetary policy and international trade."),

    # History
    ("HI4101", "Modern British History", "British political and social history from 1850 to the present day."),
    ("HI4202", "European History 1914-1945", "The causes and consequences of the First and Second World Wars."),
    ("HI4303", "Global History", "Colonialism, decolonisation and the making of the modern world."),

    # English Literature and Philosophy
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
    ("NU4203", "Mental Health Nursing", "Therapeutic communication, mental health assessment and care planning for patients with psychological conditions."),
    ("NU4204", "Adult Nursing in Acute Settings", "Managing patients in high-dependency environments including post-operative and emergency care."),
    
    # Dentistry
    ("DE4101", "Oral Biology", "Structure and function of teeth, supporting tissues and oral health."),

    # Modern Languages =
    ("FR4101", "French Language I", "Introductory French for beginners. Speaking, listening, reading and writing skills."),
    ("FR4202", "French Language II", "Intermediate French. Grammar consolidation, conversation and written expression."),
    ("SP4101", "Spanish Language I", "Introductory Spanish. Core grammar, vocabulary and everyday communication skills."),
    ("SP4202", "Spanish Language II", "Intermediate Spanish. Cultural contexts, literature and advanced conversation."),
    ("GL4101", "German Language I", "Introductory German. Pronunciation, grammar foundations and practical communication."),
    ("GL4202", "German Language II", "Intermediate German. Reading, writing, conversation and cultural context."),
    ("AR4101", "Arabic Language I", "Modern Standard Arabic script, pronunciation, grammar and basic conversation."),
    ("ZH4101", "Mandarin Chinese I", "Introduction to Mandarin. Pinyin, tones, characters and everyday expressions."),

    # Arts and Humanities =
    ("FA4101", "History of Art", "Survey of Western art from the Renaissance to the contemporary period."),
    ("FA4202", "Contemporary Art & Theory", "Critical frameworks for understanding art since 1960."),
    ("TH4101", "Introduction to Theatre Studies", "Performance theory, dramatic texts and the history of theatre."),
    ("MU4101", "Music History", "Western classical music from Bach to the 20th century."),
    ("MU4202", "Music Theory", "Notation, harmony, counterpoint and compositional techniques."),
    ("CL4101", "Classical Studies", "Greek and Roman literature, history and culture in translation."),
    ("CR4101", "Creative Writing", "Fiction, poetry and non-fiction workshops with peer critique."),
)

course_fixtures = (
    "Computer Science", "Artificial Intelligence", "Mathematics", "Physics", "Chemistry",
    "Law", "Medicine", "Biomedical Science", "Neuroscience", "Psychology", "Nursing",
    "Business Management", "Economics", "Politics", "History", "English Literature",
    "Philosophy", "Film Studies", "Dentistry", "Geography",
    "International Relations",
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
    "FA": "Arts & Humanities",
    "TH": "Arts & Humanities",
    "MU": "Arts & Humanities",
    "CL": "Arts & Humanities",
    "CR": "Arts & Humanities",
}