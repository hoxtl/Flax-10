"""
KCL module catalogue fixtures.

Each entry is a (module_code, module_name, description) triple covering
the full range of subject areas offered at King's College London.
Used by the seed command to populate the Module table.
"""

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

    # Law
    ("LW4101", "Contract Law", "Formation and enforcement of contracts, offer and acceptance, consideration and breach."),
    ("LW4202", "Constitutional Law", "UK constitutional principles, parliamentary sovereignty and human rights law."),
    ("LW4303", "Criminal Law", "Principles of criminal liability, offences against the person and defences."),

    # Psychology / Neuroscience
    ("PS4101", "Introduction to Psychology", "Cognitive, social and developmental psychology. Research methods and key theories."),
    ("PS4202", "Cognitive Neuroscience", "Neural basis of perception, memory, attention and decision-making."),
    ("PS4303", "Research Methods in Psychology", "Experimental design, statistics and ethics in psychological research."),

    # Business / Economics
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
