"""
Assessment deadline fixtures for KCL modules.
"""

# Format: (deadline_type, title, description)
# Generic fallback used when a module prefix has no specific entry below.
deadline_fixtures = (
    ("coursework", "Coursework 1", "Submit via KEATS by the deadline. Check the module page for submission instructions."),
    ("coursework", "Coursework 2", "Worth 50 marks, assessing weeks 1-5. Full brief available on KEATS."),
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
        ("coursework", "Problem Sheet 2", "Second assessed problem sheet. Covers material from weeks 4-7. Submit via KEATS by 23:59 on the due date."),
        ("exam", "January In-Class Test", "50-minute written test held in your lecture slot. Covers weeks 1-5. No calculators unless stated on KEATS."),
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
        ("exam", "Summer Term Exam", "Open-book written exam. Approved data sheets only. Check KEATS for the permitted materials list and room."),
    ],
    "GN": [
        ("coursework", "Design Portfolio", "Full portfolio of design work including concept sketches, CAD drawings, material justification, and cost estimates. Submit PDF via KEATS."),
        ("presentation", "Design Review Presentation", "10-minute group presentation of your design concept to a panel. Q&A follows. Slides to be uploaded to KEATS by 09:00 on the day."),
        ("exam", "Summer Term Exam", "Closed-book written exam. Covers thermodynamics, materials, and engineering mathematics. Formula sheet provided. Check KEATS for room."),
    ],
    "LS": [
        ("coursework", "Lab Practical Report", "Full write-up of your laboratory session. Use the standard scientific report format: introduction, methods, results, discussion. Submit via KEATS."),
        ("exam", "Reading Week Progress Test", "In-person multiple choice and short answer exam held during reading week. Covers weeks 1-5. Check KEATS for time and room allocation."),
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
        ("coursework", "Company Analysis Report", "2500-word strategic analysis of your assigned company using frameworks covered in lectures. Harvard referencing. Submit via Turnitin."),
        ("presentation", "Business Pitch Presentation", "10-minute group pitch followed by 5-minute Q&A from a panel of assessors. Slide deck to be submitted via KEATS the morning of your session."),
        ("exam", "Summer Term Exam", "Closed-book written exam with a case study and two essay questions. 2 hours. Held at Strand or Bush House campus."),
    ],
    "EC": [
        ("coursework", "Data Analysis Essay", "2000-word essay applying microeconomic or macroeconomic theory to a real-world policy issue. Include a data exhibit. Harvard referencing. Submit via Turnitin."),
        ("exam", "Mid-Term Progress Test", "50-minute in-class test held in your lecture slot. Data response and short answer questions covering weeks 1-5. Calculators permitted."),
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
