"""
Calendar event content fixtures.

Provides realistic titles for personal events, meal descriptions for
breakfast, lunch and dinner, event descriptions, real KCL campus and
transport hub locations (with full postcodes), and lecture theatre
addresses used when seeding calendar events.
"""

event_title_fixtures = (
    "Lidl Run", "Tesco Express at Midnight", "Meal Prep Sunday",
    "Coffee with Mum at Costa", "Dinner at Grandma's",
    "Brunch with the Girls", "Drinks with Flatmates",
    "Sam's Birthday Pres", "Movie Night with Housemates",
    "FaceTime with Home", "Prep for seminar",
    "Detox Run", "Gym with Jake",
    "Yoga before Lectures", "Update LinkedIn Profile",
    "Spring Week Interview", "CV Drop-in Session", "Email my Tutor",
    "Sort out Student Finance", "Pay Rent",
    "Renew Railcard", "Book Dentist",
    "GP Appointment", "Laundry (overdue)", "Deep Clean the Kitchen",
    "IKEA Trip with Mia", "Inpost parcel return", "Group project meeting",
    "Do mock exam", "Review notes",
    "Study at Maughan Library", "Bush House Lab Session", "King's Sport Gym Session",
    "KCLSU Basketball Event", "Revision at FWB with friends", "Somerset House Visit",
    "KCL Careers Fair Prep", "King's Volunteering Shift",
    "Check KEATS Grades", "Denmark Hill Placement", "St Thomas Hospital Visit",
    "KCL Research Seminar", "Strand Roof Terrace Break", "KCL Mental Health Workshop",
    "Rise and Shine", "Morning Stretch", "Take a Shower",
    "Have a coffee", "Bike to Campus",
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
    # Strand Campus
    "Bush House, Strand, London WC2B 4PJ",
    "King's Building, Strand, London WC2R 2LS",
    "Strand Campus, Strand, London WC2R 2LS",
    "Somerset House, Strand, London WC2R 1LA",
    "Maughan Library, Chancery Lane, London WC2A 1LR",
    "King's Sport, Surrey St, London WC2R 2NS",
    "KCLSU, Macadam Building, Surrey St, London WC2R 2NS",
    "Strand Building, Strand, London WC2R 2LS",

    "Pret a Manger, Strand, London WC2R 1LA",
    "Costa Coffee, Strand, London WC2R 1AP",
    "Tesco Express, Strand, London WC2R 0DX",
    "Sainsbury's Local, Kingsway, London WC2B 6TP",
    
    # Waterloo Campus
    "Franklin-Wilkins Building, 150 Stamford St, London SE1 9NH",
    "Waterloo Campus, 150 Stamford St, London SE1 9NH",
    "James Clerk Maxwell Building, 57 Waterloo Rd, London SE1 8WA",

    "Pret a Manger, Waterloo Station, London SE1 8SW",
    "Greggs, Borough High St, London SE1 1JA",
    "Borough Market, 8 Southwark St, London SE1 1TL",
    
    # Guy's Campus
    "Guy's Campus, Great Maze Pond, London SE1 9RT",
    "New Hunt's House, Great Maze Pond, London SE1 9RT",
    "Guy's Hospital, Great Maze Pond, London SE1 9RT",

    # St Thomas' Campus
    "St Thomas' Hospital, Westminster Bridge Rd, London SE1 7EH",
    "St Thomas' Campus, Lambeth Palace Rd, London SE1 7EH",

    # Denmark Hill Campus
    "Denmark Hill Campus, De Crespigny Park, London SE5 8AF",
    "Institute of Psychiatry, De Crespigny Park, London SE5 8AF",
    "King's College Hospital, Denmark Hill, London SE5 9RS",

    "Costa Coffee, Denmark Hill, London SE5 8RS",
    "Lidl, Coldharbour Ln, London SE5 9NR",
    "Nour Cash & Carry, Coldharbour Ln, London SE5 9NR",

    # Transport hubs near campuses
    "Temple Station, Victoria Embankment, London WC2R 2PH",
    "Holborn Station, High Holborn, London WC1V 7PP",
    "Charing Cross Station, Strand, London WC2N 5HS",
    "Waterloo Station, Waterloo Rd, London SE1 8SW",
    "London Bridge Station, London Bridge, London SE1 9SP",
    "Blackfriars Station, Queen Victoria St, London EC4V 3AT",
    "Southwark Station, The Cut, London SE1 8LN",
    "Borough Station, Borough High St, London SE1 1JA",
    "Elephant & Castle Station, Elephant Rd, London SE1 6TE",
    "Denmark Hill Station, Denmark Hill, London SE5 8RS",
)

lecture_theatre_fixtures = (
    # Strand Campus
    "Bush House Auditorium BH(N)0.01, Strand, London WC2B 4PJ",
    "Bush House Lecture Theatre BH(S)1.01, Strand, London WC2B 4PJ",
    "Edmond J. Safra Lecture Theatre, King's Building, Strand, London WC2R 2LS",
    "K0.16 Lecture Theatre, King's Building, Strand, London WC2R 2LS",
    "Nash Lecture Theatre, Strand Building, Strand, London WC2R 2LS",
    "Great Hall, Strand Campus, London WC2R 2LS",
    "IET Kelvin Lecture Theatre, 2 Savoy Pl, London WC2R 0BL",

    # Waterloo Campus
    "FWB B5 Lecture Theatre, Franklin-Wilkins Building, London SE1 9NH",
    "FWB 1.01 Seminar Room, Franklin-Wilkins Building, London SE1 9NH",
    "JCM Lecture Theatre, James Clerk Maxwell Building, London SE1 8WA",

    # Guy's Campus
    "New Hunt's House Lecture Theatre 1, Great Maze Pond, London SE1 9RT",
    "Nevin Lecture Theatre, New Hunt's House, London SE1 9RT",
    "Guy's Hospital Lecture Theatre, Great Maze Pond, London SE1 9RT",

    # St Thomas' Campus
    "Wolfson Lecture Theatre, St Thomas' Hospital, London SE1 7EH",
    "Weston Education Centre Lecture Theatre, Cutcombe Rd, London SE5 9RJ",

    # Denmark Hill Campus
    "Harris Lecture Theatre, De Crespigny Park, London SE5 8AF",
    "P049 Seminar Room, Institute of Psychiatry, London SE5 8AF",
)
