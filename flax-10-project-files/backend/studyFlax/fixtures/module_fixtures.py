"""
KCL module catalogue fixtures.

Each entry is a (module_code, module_name, description) triple covering
the full range of subject areas offered at King's College London.
Used by the seed command to populate the Module table.
"""

# Format: (module_code, module_name, description)
module_fixtures = (
    # Computer Science (CS)
    ("CS4101", "Introduction to Programming", "Fundamentals of programming using Python. Covers variables, loops, functions and data structures."),
    ("CS4202", "Data Structures & Algorithms", "Core algorithms and data structures including trees, graphs, sorting and searching."),
    ("CS4303", "Software Engineering", "Software development lifecycle, agile methods, version control and team project work."),
    ("CS4404", "Databases & Information Systems", "Relational databases, SQL, data modelling and information retrieval."),
    ("CS4505", "Computer Networks", "Network protocols, TCP/IP, routing, security and distributed systems."),

    # Artificial Intelligence (AI)
    ("AI4101", "Machine Learning Fundamentals", "Supervised and unsupervised learning, neural networks, and model evaluation."),
    ("AI4202", "Natural Language Processing", "Text processing, language models, sentiment analysis and sequence modelling."),
    ("AI4303", "Computer Vision", "Image recognition, convolutional networks, object detection and scene understanding."),
    ("AI4404", "Reinforcement Learning", "Markov decision processes, Q-learning, policy gradients and multi-agent systems."),
    ("AI4505", "AI Ethics & Society", "Bias, fairness, accountability and the social impact of artificial intelligence."),

    # Electronic Engineering (EE)
    ("EE4101", "Circuit Theory & Electronics", "Fundamentals of electrical circuits, components, and electronic systems."),
    ("EE4202", "Digital Systems & Logic Design", "Boolean algebra, logic gates, combinational and sequential digital circuits."),
    ("EE4303", "Signals & Systems", "Signal processing, Fourier transforms, filtering and communication systems."),
    ("EE4404", "Embedded Systems", "Microcontrollers, real-time operating systems and hardware-software co-design."),
    ("EE4505", "Control Systems", "Feedback control, stability analysis, PID controllers and state-space methods."),

    # General Engineering (GN)
    ("GN4101", "Engineering Mathematics", "Mathematical methods for engineers including calculus, ODEs and linear algebra."),
    ("GN4202", "Engineering Design & Materials", "Design principles, material properties, manufacturing processes and sustainability."),
    ("GN4303", "Thermodynamics & Fluid Mechanics", "Energy, heat transfer, fluid behaviour and engineering applications."),
    ("GN4404", "Project Management for Engineers", "Planning, risk assessment, resource allocation and professional practice."),
    ("GN4505", "Robotics & Automation", "Robot kinematics, sensors, actuators and autonomous systems."),

    # Mathematics (MA)
    ("MA4101", "Calculus I", "Differential and integral calculus. Limits, derivatives, integrals and applications."),
    ("MA4202", "Linear Algebra", "Vectors, matrices, linear transformations, eigenvalues and eigenvectors."),
    ("MA4303", "Probability & Statistics", "Probability theory, distributions, hypothesis testing and statistical inference."),
    ("MA4404", "Real Analysis", "Sequences, series, continuity, differentiation and integration on the real line."),
    ("MA4505", "Discrete Mathematics", "Combinatorics, graph theory, logic and proof techniques."),

    # Physics (PH)
    ("PH4101", "Classical Mechanics", "Newtonian mechanics, energy, momentum, rotational motion and oscillations."),
    ("PH4202", "Electromagnetism", "Electric and magnetic fields, Maxwell's equations and electromagnetic waves."),
    ("PH4303", "Quantum Mechanics", "Wave-particle duality, Schrödinger equation, and quantum states."),
    ("PH4404", "Thermal Physics", "Thermodynamics, statistical mechanics, entropy and phase transitions."),
    ("PH4505", "Astrophysics", "Stellar evolution, galaxies, cosmology and observational techniques."),

    # Chemistry (CH)
    ("CH4101", "General Chemistry", "Atomic structure, bonding, stoichiometry and introductory organic chemistry."),
    ("CH4202", "Organic Chemistry", "Functional groups, reaction mechanisms, stereochemistry and synthesis."),
    ("CH4303", "Physical Chemistry", "Thermodynamics, kinetics, quantum chemistry and spectroscopy."),
    ("CH4404", "Inorganic Chemistry", "Coordination compounds, transition metals and solid-state chemistry."),
    ("CH4505", "Analytical Chemistry", "Chromatography, mass spectrometry, electrochemistry and method validation."),

    # Computer Science with Management (CM)
    ("CM4101", "Technology & Business Strategy", "Digital transformation, IT governance and technology-driven business models."),
    ("CM4202", "Data Analytics for Managers", "Statistical methods, data visualisation and decision-making with data."),
    ("CM4303", "Information Systems Management", "Enterprise systems, IT service management and digital infrastructure."),
    ("CM4404", "Innovation & Entrepreneurship", "Start-up methodology, product development and venture financing."),
    ("CM4505", "Human-Computer Interaction", "Usability engineering, UX research, prototyping and accessibility."),

    # Biomedical Science (LS)
    ("LS4101", "Cell Biology", "Cell structure, function, division and molecular biology fundamentals."),
    ("LS4202", "Biochemistry Foundations", "Proteins, enzymes, metabolism and molecular interactions in living systems."),
    ("LS4303", "Human Anatomy", "Structure and function of the human body systems."),
    ("LS4404", "Physiology", "Mechanisms of body function including cardiovascular, respiratory and renal systems."),
    ("LS4505", "Microbiology & Immunology", "Bacteria, viruses, immune responses and infectious disease mechanisms."),

    # Medicine (MD)
    ("MD4101", "Clinical Medicine I", "Introduction to clinical practice, patient assessment and medical history taking."),
    ("MD4202", "Pharmacology", "Drug mechanisms, pharmacokinetics, prescribing principles and adverse reactions."),
    ("MD4303", "Pathology", "Disease mechanisms, histopathology, inflammation and neoplasia."),
    ("MD4404", "Medical Ethics & Law", "Consent, confidentiality, end-of-life decisions and professional regulation."),
    ("MD4505", "Public Health & Epidemiology", "Disease prevention, health promotion, study design and population health."),

    # Neuroscience (NS)
    ("NS4101", "Introduction to Neuroscience", "Structure of the nervous system, neurons, synapses and brain organisation."),
    ("NS4202", "Behavioural Neuroscience", "Neural mechanisms of learning, memory, emotion and motivation."),
    ("NS4303", "Neuroanatomy", "Detailed brain anatomy, cranial nerves and neuroimaging techniques."),
    ("NS4404", "Neuropsychology", "Brain lesions, cognitive deficits and clinical assessment methods."),
    ("NS4505", "Computational Neuroscience", "Neural coding, network models and brain-computer interfaces."),

    # Law (LW)
    ("LW4101", "Contract Law", "Formation and enforcement of contracts, offer and acceptance, consideration and breach."),
    ("LW4202", "Constitutional Law", "UK constitutional principles, parliamentary sovereignty and human rights law."),
    ("LW4303", "Criminal Law", "Principles of criminal liability, offences against the person and defences."),
    ("LW4404", "Tort Law", "Negligence, duty of care, causation and remedies in civil liability."),
    ("LW4505", "EU Law", "EU institutions, free movement, competition law and Brexit implications."),

    # Psychology (PS)
    ("PS4101", "Introduction to Psychology", "Cognitive, social and developmental psychology. Research methods and key theories."),
    ("PS4202", "Cognitive Neuroscience", "Neural basis of perception, memory, attention and decision-making."),
    ("PS4303", "Research Methods in Psychology", "Experimental design, statistics and ethics in psychological research."),
    ("PS4404", "Developmental Psychology", "Cognitive, social and emotional development from infancy to adolescence."),
    ("PS4505", "Social Psychology", "Group behaviour, attitudes, persuasion, conformity and prejudice."),

    # Business Management (BM)
    ("BM4101", "Business Strategy", "Strategic analysis, competitive advantage, market positioning and case studies."),
    ("BM4202", "Marketing Management", "Consumer behaviour, branding, digital marketing and market research methods."),
    ("BM4303", "Organisational Behaviour", "Leadership, motivation, team dynamics and organisational culture."),
    ("BM4404", "Operations Management", "Supply chain, quality management, lean processes and service operations."),
    ("BM4505", "Human Resource Management", "Recruitment, performance management, employment law and talent development."),

    # Accounting and Finance (AF)
    ("AF4101", "Financial Accounting", "Financial statements, double-entry bookkeeping, IFRS standards and reporting."),
    ("AF4202", "Management Accounting", "Budgeting, costing, variance analysis and performance measurement."),
    ("AF4303", "Corporate Finance", "Capital structure, investment appraisal, risk management and valuation."),
    ("AF4404", "Auditing & Assurance", "Audit planning, internal controls, evidence gathering and professional standards."),
    ("AF4505", "Financial Markets & Instruments", "Equities, bonds, derivatives, portfolio theory and market regulation."),

    # Economics (EC)
    ("EC4101", "Microeconomics", "Supply and demand, market structures, consumer theory and welfare economics."),
    ("EC4202", "Macroeconomics", "GDP, inflation, unemployment, monetary policy and international trade."),
    ("EC4303", "Econometrics", "Regression analysis, time series, panel data and causal inference methods."),
    ("EC4404", "Development Economics", "Poverty, inequality, growth theory and policy interventions."),
    ("EC4505", "Game Theory", "Strategic interaction, Nash equilibrium, auctions and mechanism design."),

    # International Management (IM)
    ("IM4101", "Global Business Environment", "International trade frameworks, emerging markets and cross-cultural management."),
    ("IM4202", "International Marketing Strategy", "Market entry modes, global branding and cross-border consumer behaviour."),
    ("IM4303", "International Finance", "Exchange rates, foreign direct investment and multinational treasury management."),
    ("IM4404", "Cross-Cultural Leadership", "Cultural dimensions, global teams and managing diversity across borders."),
    ("IM4505", "Supply Chain & Logistics", "Global supply networks, procurement, warehousing and trade compliance."),

    # History (HI)
    ("HI4101", "Modern British History", "British political and social history from 1850 to the present day."),
    ("HI4202", "European History 1914-1945", "The causes and consequences of the First and Second World Wars."),
    ("HI4303", "Global History", "Colonialism, decolonisation and the making of the modern world."),
    ("HI4404", "Medieval History", "Power, religion and society in Europe from 500 to 1500."),
    ("HI4505", "History of Science & Medicine", "Scientific revolutions, public health and the evolution of medical practice."),

    # English Literature (EN)
    ("EN4101", "Literary Theory", "Critical frameworks for reading literature including structuralism, post-colonialism and feminism."),
    ("EN4202", "Modern Fiction", "Close reading of 20th and 21st century novels and short stories."),
    ("EN4303", "Shakespeare & Early Modern Drama", "Close study of major plays, performance history and cultural context."),
    ("EN4404", "Romantic & Victorian Literature", "Poetry and prose from 1780 to 1900 in historical context."),
    ("EN4505", "Postcolonial Literature", "Voices from Africa, South Asia and the Caribbean in English."),

    # Philosophy (PL)
    ("PL4101", "Ethics & Political Philosophy", "Justice, rights, liberty and the foundations of political authority."),
    ("PL4202", "Philosophy of Mind", "Consciousness, mental representation, and the mind-body problem."),
    ("PL4303", "Logic & Critical Thinking", "Formal logic, argument analysis and common fallacies."),
    ("PL4404", "Epistemology", "Knowledge, justification, scepticism and the structure of belief."),
    ("PL4505", "Aesthetics", "Beauty, art, taste and the philosophy of creative expression."),

    # Geography (GE)
    ("GE4101", "Human Geography", "Urbanisation, migration, globalisation and spatial inequality."),
    ("GE4202", "Environmental Geography", "Climate systems, biodiversity, sustainability and human-environment interactions."),
    ("GE4303", "Physical Geography", "Geomorphology, hydrology, soils and landscape evolution."),
    ("GE4404", "GIS & Spatial Analysis", "Geographic information systems, remote sensing and spatial data science."),
    ("GE4505", "Urban Planning & Policy", "Land use, transport, housing policy and sustainable cities."),

    # Politics (PO)
    ("PO4101", "Introduction to Politics", "Political institutions, ideologies, and comparative government."),
    ("PO4202", "British Politics", "The UK political system, parties, elections and devolution."),
    ("PO4303", "Political Theory", "Democracy, freedom, justice and the great political thinkers."),
    ("PO4404", "Comparative Politics", "Political systems, regime types and governance across countries."),
    ("PO4505", "Public Policy Analysis", "Policy-making processes, evaluation methods and case studies."),

    # International Relations (IR)
    ("IR4101", "International Relations Theory", "Realism, liberalism, constructivism and the structure of world politics."),
    ("IR4202", "Global Security", "Conflict, terrorism, peacekeeping and the evolving security landscape."),
    ("IR4303", "Diplomacy & Foreign Policy", "Diplomatic history, negotiation strategies and foreign policy analysis."),
    ("IR4404", "International Law", "Sovereignty, treaties, humanitarian law and international courts."),
    ("IR4505", "Global Governance", "The UN, NATO, WTO and the future of multilateral institutions."),

    # Nursing (NU)
    ("NU4101", "Foundations of Nursing Practice", "Patient care principles, clinical skills and professional ethics."),
    ("NU4102", "Anatomy & Physiology for Nurses", "Body systems and their functions with a focus on clinical application."),
    ("NU4203", "Mental Health Nursing", "Therapeutic communication, mental health assessment and care planning."),
    ("NU4204", "Adult Nursing in Acute Settings", "Managing patients in high-dependency and emergency care environments."),
    ("NU4205", "Child and Family Nursing", "Paediatric care principles, family-centred nursing and safeguarding."),

    # Midwifery (MW)
    ("MW4101", "Foundations of Midwifery", "Antenatal, intrapartum and postnatal care principles and evidence-based practice."),
    ("MW4202", "Maternal & Newborn Health", "Physiology of pregnancy, labour complications and neonatal assessment."),
    ("MW4303", "High-Risk Pregnancy", "Pre-eclampsia, gestational diabetes, multiple pregnancies and interventions."),
    ("MW4404", "Public Health in Midwifery", "Health promotion, screening, safeguarding and community midwifery."),
    ("MW4505", "Professional Practice in Midwifery", "Reflective practice, leadership, clinical governance and NMC standards."),

    # Dentistry (DE)
    ("DE4101", "Oral Biology", "Structure and function of teeth, supporting tissues and oral health."),
    ("DE4202", "Clinical Dentistry", "Restorative procedures, oral diagnosis, treatment planning and patient care."),
    ("DE4303", "Dental Materials", "Properties of restorative materials, ceramics, polymers and biocompatibility."),
    ("DE4404", "Oral Pathology", "Diseases of the mouth, salivary glands and jaw including malignancies."),
    ("DE4505", "Periodontology", "Gum disease, periodontal assessment, non-surgical and surgical treatment."),

    # Film Studies (FA)
    ("FA4101", "History of Art", "Survey of Western art from the Renaissance to the contemporary period."),
    ("FA4202", "Contemporary Art & Theory", "Critical frameworks for understanding art since 1960."),
    ("FA4303", "World Cinema", "Film movements, national cinemas and transnational storytelling."),
    ("FA4404", "Screenwriting & Narrative", "Story structure, character development and script analysis."),
    ("FA4505", "Documentary Film", "History, ethics and aesthetics of non-fiction filmmaking."),

    # Music (MU)
    ("MU4101", "Music History", "Western classical music from Bach to the 20th century."),
    ("MU4202", "Music Theory", "Notation, harmony, counterpoint and compositional techniques."),
    ("MU4303", "Music Performance", "Ensemble and solo performance, interpretation and stage presence."),
    ("MU4404", "Ethnomusicology", "Music traditions from around the world and cultural context."),
    ("MU4505", "Music Technology", "Digital audio, synthesis, recording and electronic music production."),

    # Theatre (TH)
    ("TH4101", "Introduction to Theatre Studies", "Performance theory, dramatic texts and the history of theatre."),
    ("TH4202", "Directing & Dramaturgy", "Staging, script analysis, rehearsal process and production design."),
    ("TH4303", "Physical Theatre & Movement", "Body awareness, devised performance and movement techniques."),
    ("TH4404", "Theatre & Politics", "Political drama, protest performance and community theatre."),
    ("TH4505", "Contemporary Performance", "Live art, site-specific work and experimental theatre practice."),

    # Modern Languages
    # French (FR)
    ("FR4101", "French Language I", "Introductory French: core grammar, practical speaking, listening and reading skills."),
    ("FR4202", "French Language II", "Intermediate grammar, writing composition and oral fluency development."),
    ("FR4303", "French Literature", "Major texts from the 17th century to the present in cultural context."),
    ("FR4404", "French Cinema & Culture", "New Wave cinema, contemporary film and Francophone cultural identity."),
    ("FR4505", "Translation Studies: French", "Theory and practice of French-English translation across genres."),

    # Spanish (SP)
    ("SP4101", "Spanish Language I", "Introductory Spanish: grammar foundations, pronunciation and everyday communication."),
    ("SP4202", "Spanish Language II", "Intermediate grammar, composition and conversational skills."),
    ("SP4303", "Latin American Literature and Identity", "Magical realism, postcolonial identity and contemporary fiction."),
    ("SP4404", "Spanish in the Contemporary World", "Politics, media, activism and the global reach of the Spanish language."),
    ("SP4505", "Spanish Golden Age Literature", "Cervantes, Lope de Vega and the literary culture of early modern Spain."),

    # German (GL)
    ("GL4101", "German Language I", "Introductory German: pronunciation, grammar foundations and practical communication."),
    ("GL4202", "German Language II", "Intermediate German grammar, writing and oral expression."),
    ("GL4303", "German History Through Language", "Weimar Republic, Third Reich and reunification through primary sources."),
    ("GL4404", "Contemporary German Society", "Migration, identity politics and modern Germany in text and media."),
    ("GL4505", "German Literature", "Major works from Goethe to contemporary authors in cultural context."),

    # Arabic (AR)
    ("AR4101", "Arabic Language I", "Modern Standard Arabic script, grammar and introductory conversation."),
    ("AR4202", "Arabic Language II", "Intermediate reading, writing and spoken Arabic for academic contexts."),
    ("AR4303", "Arabic Media and Politics", "News broadcasts, speeches and social media in Arabic."),
    ("AR4404", "Arabic Literature", "Classical and modern Arabic poetry, prose and storytelling traditions."),
    ("AR4505", "Middle Eastern History & Culture", "History, society and cultural expression in the Arab world."),

    # Chinese (ZH)
    ("ZH4101", "Chinese Language I", "Mandarin pinyin, character writing and basic conversational skills."),
    ("ZH4202", "Chinese Language II", "Intermediate grammar, reading comprehension and composition."),
    ("ZH4303", "Chinese Society and Culture", "Contemporary China through film, literature and media."),
    ("ZH4404", "Chinese Business & Economy", "China's economic rise, trade policy and business practices."),
    ("ZH4505", "Classical Chinese Thought", "Confucianism, Daoism, Legalism and their modern influence."),

    # Italian (IT)
    ("IT4101", "Italian Language I", "Core Italian grammar, conversational skills and cultural introduction."),
    ("IT4202", "Italian Language II", "Intermediate grammar, reading and oral communication."),
    ("IT4303", "Italian Cinema", "Neorealism, Fellini, contemporary Italian film and cultural context."),
    ("IT4404", "Italian Renaissance Culture", "Art, literature and ideas of the Italian Renaissance."),
    ("IT4505", "Italian Literature", "Major Italian authors from Dante to contemporary writers."),

    # Portuguese (PT)
    ("PT4101", "Portuguese Language I", "Brazilian Portuguese grammar foundations and everyday communication."),
    ("PT4202", "Portuguese Language II", "Intermediate grammar, composition and Lusophone cultural studies."),
    ("PT4303", "Brazilian Culture & Society", "Music, film, politics and identity in contemporary Brazil."),
    ("PT4404", "Lusophone Literature", "Literature from Portugal, Brazil, Mozambique and Angola."),
    ("PT4505", "Portuguese for Business", "Professional communication, trade vocabulary and formal writing."),

    # Classics (CL)
    ("CL4101", "Introduction to Ancient Greek", "Greek alphabet, grammar foundations and introductory texts."),
    ("CL4202", "Latin Language & Literature", "Latin grammar, prose composition and major literary works."),
    ("CL4303", "Greek & Roman Mythology", "Myths, religion and their influence on Western culture."),
    ("CL4404", "Ancient History", "Greek city-states, Roman Republic and Empire, daily life and society."),
    ("CL4505", "Classical Philosophy", "Plato, Aristotle, Stoics and Epicureans in historical context."),

    # Creative Writing (CR)
    ("CR4101", "Introduction to Creative Writing", "Fiction, poetry and creative non-fiction workshop and craft techniques."),
    ("CR4202", "Short Fiction Workshop", "Writing, workshopping and revising short stories across genres."),
    ("CR4303", "Poetry Workshop", "Form, voice, imagery and the craft of contemporary poetry."),
    ("CR4404", "Screenwriting", "Script format, story structure, dialogue and visual storytelling."),
    ("CR4505", "Life Writing & Memoir", "Personal narrative, memory, ethics and the art of autobiography."),

    # Note: TH prefix is used for Theatre above; Theology modules use TY prefix
)
