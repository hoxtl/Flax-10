"""
Fixture data and helper functions for seeding societies, events, and categories.
"""

import random
from datetime import datetime, timedelta
from django.utils import timezone

# Valid society categories (consolidated to 8)
VALID_CATEGORIES = [
    'sports', 'cultural', 'academic', 'arts',
    'social', 'religious', 'volunteering', 'media'
]

# Images per category, with gaming merged into social, music and dance into arts,
# and professional into academic
CATEGORY_IMAGES = {
    'sports': ['sports1.jpg', 'sports2.jpg'],
    'cultural': ['cultural1.jpg', 'cultural2.jpg'],
    'academic': ['academic1.jpg', 'academic2.jpg', 'professional1.jpg', 'professional2.jpg'],
    'arts': ['arts1.jpg', 'arts2.jpg', 'music1.jpg', 'music2.jpg', 'dance1.jpg', 'dance2.jpg'],
    'social': ['social1.jpg', 'social2.jpg', 'gaming1.jpg', 'gaming2.jpg'],
    'religious': ['religious1.jpg', 'religious2.jpg'],
    'volunteering': ['volunteering1.jpg', 'volunteering2.jpg'],
    'media': ['media1.jpg', 'media2.jpg'],
}

# Reusable event templates by category
# Format: (title, description, hour, duration_mins, recurrence, day_of_week)
# day_of_week: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun (None for one-off)
EVENT_TEMPLATES = {
    'sports': [
        ('Weekly Training', 'Regular training session for all members.', 18, 90, 'weekly', 2),
        ('Match Day', 'Competitive match against another team.', 14, 120, None, 5),
        ('Fitness Session', 'Gym workout with the team.', 17, 60, 'weekly', 4),
        ('Social Drinks', 'Post-training drinks at the student bar.', 20, 120, None, None),
    ],
    'cultural': [
        ('Weekly Meeting', 'Regular society meetup and planning.', 18, 90, 'weekly', 3),
        ('Cultural Night', 'Celebrate our heritage with food and performances.', 19, 180, None, 5),
        ('Language Exchange', 'Practice languages with native speakers.', 17, 90, 'weekly', 1),
        ('Festival Celebration', 'Annual festival celebration event.', 18, 180, None, None),
    ],
    'academic': [
        ('Weekly Workshop', 'Skill-building workshop for members.', 17, 90, 'weekly', 2),
        ('Guest Speaker', 'Talk from an industry professional.', 18, 90, None, None),
        ('Study Group', 'Collaborative study session.', 14, 120, 'weekly', 5),
        ('Competition Prep', 'Prepare for upcoming competitions.', 16, 120, None, None),
    ],
    'arts': [
        ('Weekly Practice', 'Regular practice session.', 18, 120, 'weekly', 3),
        ('Exhibition Opening', 'Showcase member work.', 19, 120, None, 5),
        ('Workshop', 'Learn new techniques.', 14, 150, None, 5),
        ('Critique Session', 'Peer feedback on works in progress.', 17, 90, 'biweekly', 1),
    ],
    'social': [
        ('Weekly Social', 'Casual hangout for members.', 19, 120, 'weekly', 4),
        ('Games Night', 'Board games and fun.', 18, 180, 'biweekly', 3),
        ('Trip Planning', 'Plan upcoming society trips.', 17, 60, None, None),
        ('End of Term Party', 'Celebrate the end of term.', 20, 180, None, 5),
    ],
    'religious': [
        ('Weekly Meeting', 'Regular gathering and discussion.', 18, 90, 'weekly', 3),
        ('Study Circle', 'Scripture study and reflection.', 17, 60, 'weekly', 1),
        ('Community Event', 'Open event for all students.', 14, 120, None, 5),
        ('Charity Drive', 'Fundraising for a good cause.', 10, 240, None, 5),
    ],
    'volunteering': [
        ('Weekly Volunteering', 'Regular volunteering shift.', 10, 180, 'weekly', 5),
        ('Planning Meeting', 'Organise upcoming activities.', 18, 60, 'weekly', 1),
        ('Community Event', 'Special volunteering event.', 9, 240, None, 5),
        ('Fundraiser', 'Raise money for charity.', 12, 180, None, 5),
    ],
    'media': [
        ('Weekly Meeting', 'Editorial planning and updates.', 18, 90, 'weekly', 1),
        ('Production Day', 'Create content together.', 14, 180, 'weekly', 5),
        ('Training Session', 'Learn new skills.', 17, 90, None, 3),
        ('Live Event', 'Special live broadcast or screening.', 19, 120, None, 4),
    ],
}


def get_events_for_category(category):
    return EVENT_TEMPLATES.get(category, EVENT_TEMPLATES['social'])


# Map old categories to consolidated ones
CATEGORY_MAPPING = {
    'gaming': 'social', 'music': 'arts', 'dance': 'arts', 'professional': 'academic'
}

# KCL campus locations per category
CATEGORY_LOCATIONS = {
    'sports': 'Strand Sports Centre, Surrey Street, London WC2R 2NS',
    'cultural': "King's Building, Strand Campus, London WC2R 2LS",
    'academic': 'Bush House, 30 Aldwych, London WC2B 4BG',
    'arts': 'Anatomy Museum, Strand Campus, London WC2R 2LS',
    'social': 'K Bar, Strand Campus, London WC2R 2LS',
    'religious': 'Stamp Room, Strand Campus, London WC2R 2LS',
    'volunteering': "Guy's Campus, Great Maze Pond, London SE1 9RT",
    'media': 'Macadam Building, Portugal Street, London WC2A 2JR',
    'music': 'Great Hall, Strand Campus, London WC2R 2LS',
    'dance': 'Strand Sports Centre, Surrey Street, London WC2R 2NS',
    'gaming': 'Nash Fleming Common Room, Strand Campus, London WC2R 2LS',
    'professional': 'Bush House, 30 Aldwych, London WC2B 4BG',
}


# Society data — 30 carefully curated entries with rich about text
# Format: (name, bio, about, category, tags, location_override)
SOCIETY_DATA = [
    # Sports (5)
    (
        'Football Club',
        'The beautiful game at KCL — open to all skill levels.',
        (
            "Football Club is the largest sports society at King's, bringing together students "
            "from every faculty who share a passion for the game. Whether you've played since "
            "childhood or never laced up boots competitively, you'll find a place in our "
            "weekly training sessions on Wednesdays and regular fixtures against other London "
            "university clubs throughout the academic year. The club competes in BUCS leagues "
            "and runs social events each term, including a pre-season tour and an end-of-year "
            "awards dinner."
        ),
        'sports',
        ['Training', 'Match', 'Social', 'BUCS'],
        None,
    ),
    (
        'Basketball Society',
        'Hoops for all — casual pick-up games to competitive league play.',
        (
            "Basketball Society caters to everyone from complete beginners wanting to learn the "
            "basics to seasoned players looking for structured competition. We run open gym "
            "sessions twice a week at the Strand Sports Centre where you can improve your "
            "shooting, passing, and defensive skills with coaching from experienced players. "
            "The society fields both men's and mixed teams in the BUCS league, and our end-of-term "
            "socials are some of the most attended events on campus."
        ),
        'sports',
        ['Training', 'Tournament', 'Social', 'BUCS'],
        None,
    ),
    (
        'Yoga Society',
        'Find balance — mindful yoga sessions for body and mind.',
        (
            "Yoga Society offers a calm and focused space in the middle of a busy academic week. "
            "Sessions run every Monday and Thursday evening in the Anatomy Museum Studio, "
            "suitable for complete beginners through to experienced practitioners. We cover "
            "a variety of styles including Hatha, Vinyasa, and restorative yoga, with occasional "
            "weekend workshops led by visiting instructors from London studios. Many members "
            "find regular practice noticeably improves their focus and sleep — something worth "
            "checking against your analytics before committing to a new time slot."
        ),
        'sports',
        ['Class', 'Workshop', 'Mindfulness', 'Beginner-Friendly'],
        'Anatomy Museum Studio, Strand Campus, London WC2R 2LS',
    ),
    (
        'Climbing Club',
        'Reach new heights — indoor and outdoor bouldering for all levels.',
        (
            "Climbing Club runs weekly sessions at a local bouldering gym as well as organising "
            "day trips to outdoor crags in the South East throughout the year. Beginners start "
            "with top-rope fundamentals and progress quickly with peer coaching from the club's "
            "more experienced members. We keep group sizes small so everyone gets meaningful "
            "time on the wall. Annual highlights include an Easter trip to Font in France and "
            "a competition at a major London climbing centre."
        ),
        'sports',
        ['Bouldering', 'Outdoor', 'Training', 'Trip'],
        'Vauxwall Climbing Centre, 77 Glasshill St, London SE1 0QR',
    ),
    (
        'Athletics Club',
        'Track, field, and road running — train with a team behind you.',
        (
            "Athletics Club welcomes sprinters, distance runners, jumpers, and throwers alike. "
            "We train twice weekly at Crystal Palace National Sports Centre and hold regular "
            "time trials and intra-club competitions across the season. The club competes in "
            "BUCS Athletics Championships and the LUSL road relay, and a dedicated coaching "
            "team means new members develop quickly. Social runs along the South Bank are a "
            "popular way to wind down between heavier training blocks."
        ),
        'sports',
        ['Track', 'Road Running', 'Competition', 'BUCS'],
        'Crystal Palace National Sports Centre, Ledrington Road, London SE19 2BB',
    ),

    # Cultural (4)
    (
        'Chinese Society',
        'Celebrating Chinese culture, language, and community at KCL.',
        (
            "Chinese Society is one of the most active cultural societies on campus, running "
            "events throughout the year that bring together students interested in Chinese "
            "heritage — whether or not they have a personal connection to it. Highlights "
            "include Lunar New Year celebrations in the Great Hall, monthly hotpot nights, "
            "and a language exchange programme paired with native Mandarin speakers. We also "
            "organise cultural trips to London's Chinatown and host visiting speakers from "
            "Chinese arts and business communities. New members are warmly welcomed at any "
            "point in the year."
        ),
        'cultural',
        ['Festival', 'Language Exchange', 'Food', 'Social'],
        None,
    ),
    (
        'African Caribbean Society',
        'Celebrating the richness of African and Caribbean heritage at King\'s.',
        (
            "African Caribbean Society exists to celebrate, preserve, and share the diverse "
            "cultures of Africa and the Caribbean in a vibrant, inclusive environment. Our "
            "calendar includes AFROBEATS nights, spoken word events, a Black History Month "
            "programme, and Carnival prep workshops. The society also runs important "
            "conversations about representation and community in higher education, creating "
            "a support network for students who share this background. Weekly socials are "
            "casual and welcoming — bring your friends and come as you are."
        ),
        'cultural',
        ['Performance', 'Social', 'Cultural Night', 'Workshops'],
        None,
    ),
    (
        'Indian Society',
        'From Diwali to Bollywood — Indian culture in the heart of London.',
        (
            "Indian Society is a vibrant home for students who want to celebrate and explore "
            "South Asian culture at university. Our flagship event is Diwali Night — a "
            "spectacular evening of music, dance, and food that regularly sells out. Beyond "
            "the major events, we run Bollywood dance workshops, cricket socials, and "
            "collaborative evenings with other cultural societies. Freshers are particularly "
            "encouraged to join early as the society is a fantastic way to meet people and "
            "feel at home in a new city."
        ),
        'cultural',
        ['Diwali', 'Dance', 'Cricket', 'Festival'],
        None,
    ),
    (
        'Korean Society',
        "K-culture at KCL — K-pop, food, language, and more.",
        (
            "Korean Society brings together students fascinated by Korean culture in all its "
            "forms — from K-pop and K-drama to Korean food, skincare, and language. We run "
            "K-pop dance workshops every fortnight, monthly Korean BBQ nights near campus, "
            "and a popular language exchange scheme with Korean international students. "
            "Our annual Korean Culture Night is a highlight of the spring term, featuring "
            "live performances and traditional food. The community is friendly, fast-growing, "
            "and open to anyone who wants to get involved."
        ),
        'cultural',
        ['K-Pop', 'Dance', 'Food', 'Language'],
        None,
    ),

    # Academic (4)
    (
        'Tech Society',
        'Building, hacking, and exploring the frontiers of technology.',
        (
            "Tech Society is the go-to community for students who want to do more with "
            "technology than their course alone covers. We run weekly workshops on topics "
            "ranging from machine learning and web development to cybersecurity and "
            "blockchain. Our flagship event is KCL Hackathon — a 24-hour build competition "
            "that attracts over 300 participants from across London each spring. Members also "
            "get access to industry networking evenings with engineers from top London tech "
            "firms, and a dedicated Slack channel for project collaboration and job leads. "
            "All levels of experience are welcome; the community is supportive by design."
        ),
        'academic',
        ['Hackathon', 'Workshops', 'Networking', 'Projects'],
        'Bush House, North East Wing, 30 Aldwych, London WC2B 4BG',
    ),
    (
        'Debate Society',
        'Sharp arguments, structured rounds, and competitive debating at every level.',
        (
            "Debate Society trains students in British Parliamentary debate format and "
            "competes at national tournaments including EUDC, WUDC, and Varsity against UCL "
            "and LSE. Weekly sessions are split between beginners' workshops — which teach "
            "structure, rebuttal, and persuasion from scratch — and practice rounds for "
            "experienced debaters preparing for competition. Former members have gone on to "
            "careers in law, politics, and journalism, crediting the society with giving them "
            "communication skills they use every day. No prior experience is needed to join."
        ),
        'academic',
        ['Competition', 'Workshop', 'Public Speaking', 'Beginner-Friendly'],
        'Great Hall, Strand Campus, London WC2R 2LS',
    ),
    (
        'Law Society',
        "Mooting, networking, and career prep for King's law students.",
        (
            "Law Society is the largest student society at The Dickson Poon School of Law, "
            "running a full calendar of professional development and social events throughout "
            "the year. Our mooting competition gives students the chance to argue cases in "
            "front of practising barristers, and our firm networking evenings have helped "
            "members secure training contracts and vacation schemes. We also run CV and "
            "interview workshops, a mentorship scheme with young lawyers, and an annual "
            "Law Ball. Membership is open to all students regardless of faculty."
        ),
        'academic',
        ['Mooting', 'Networking', 'Careers', 'Social'],
        'Dickson Poon School of Law, Strand Campus, London WC2R 2LS',
    ),
    (
        'Entrepreneurship Society',
        'Start something. Pitch it. Build it. Find your co-founder here.',
        (
            "Entrepreneurship Society supports students at every stage of the startup journey "
            "— from first idea to early traction. Our weekly workshops cover topics like "
            "product-market fit, fundraising, legal basics, and growth marketing, delivered "
            "by founders and investors from the London startup ecosystem. The society runs "
            "KCL Pitch Night each term, where student teams present to a panel of real "
            "investors for feedback and prizes. Our co-founder matching programme has helped "
            "launch several active ventures, and members get access to exclusive startup "
            "job boards and accelerator programmes."
        ),
        'academic',
        ['Pitch', 'Workshops', 'Startup', 'Networking'],
        'Bush House, South East Wing, 30 Aldwych, London WC2B 4BG',
    ),

    # Arts (4)
    (
        'Drama Society',
        'Performing arts at KCL — theatre, comedy, and original productions.',
        (
            "Drama Society produces three full-length theatrical productions each year, "
            "ranging from Shakespeare and Chekhov to original student-written scripts. "
            "Rehearsals take place in the Greenwood Theatre near Guy's Campus, and we "
            "perform to audiences of several hundred across each run. Alongside main stage "
            "productions, the society runs an annual comedy night, a one-act festival for "
            "student directors, and weekly skills sessions in acting, voice, and movement. "
            "You don't need previous experience to audition — what matters is enthusiasm "
            "and commitment to the rehearsal schedule."
        ),
        'arts',
        ['Theatre', 'Auditions', 'Comedy', 'Directing'],
        'Greenwood Theatre, 55 Weston Street, London SE1 3RR',
    ),
    (
        'Photography Society',
        'See the world through a different lens — shoots, exhibitions, and dark-room sessions.',
        (
            "Photography Society is for everyone from complete beginners using a smartphone "
            "to students with years of experience behind a DSLR. We run themed photo walks "
            "around London each fortnight, cover both analogue and digital technique in our "
            "workshops, and hold an end-of-year exhibition where members display their best "
            "work on campus. The society has access to a dark room facility for film "
            "photographers and a gear lending scheme so cost is never a barrier to "
            "participating. Guest critiques from professional photographers are a regular "
            "feature in the spring term."
        ),
        'arts',
        ['Photo Walks', 'Exhibition', 'Dark Room', 'Workshop'],
        "Weston Room, Guy's Campus, London SE1 9RT",
    ),
    (
        'Orchestra',
        'Classical music brought to life — rehearsals, concerts, and tours.',
        (
            "KCL Orchestra brings together students at all levels of classical musicianship "
            "for a rigorous and rewarding programme of rehearsals and performances. We "
            "rehearse every Wednesday evening in the Great Hall and give two major concerts "
            "each term — including a Christmas concert and a summer showcase. The repertoire "
            "spans Baroque to contemporary, with guest conductors joining for the flagship "
            "performances. Orchestral auditions are held at the start of each term, and "
            "chamber groups form naturally from within the orchestra for smaller, more "
            "intimate performances throughout the year."
        ),
        'arts',
        ['Rehearsal', 'Concert', 'Classical', 'Auditions'],
        'Great Hall, Strand Campus, London WC2R 2LS',
    ),
    (
        'Creative Writing Society',
        'Write, share, and get better — a community for writers of all kinds.',
        (
            "Creative Writing Society provides a consistent, supportive environment for "
            "students who write fiction, poetry, non-fiction, screenwriting, or anything in "
            "between. Our weekly sessions alternate between guided writing exercises, "
            "workshop-style peer feedback rounds, and craft talks from guest authors "
            "published with major houses. We publish an annual literary magazine — 'Strand' "
            "— which features the best writing from our members, and run a competitive short "
            "story prize each spring. The atmosphere is encouraging rather than critical, "
            "making it easy to join even if you've never shown your writing to anyone before."
        ),
        'arts',
        ['Fiction', 'Poetry', 'Workshop', 'Magazine'],
        'Norfolk Building, Strand Campus, London WC2R 2LS',
    ),

    # Social (4)
    (
        'Cooking Society',
        'Cook, eat, and connect — weekly meals made with friends.',
        (
            "Cooking Society turns a basic life skill into one of the most social things you "
            "can do at university. Each week a small group of members gather in one of the "
            "campus kitchens to cook a themed meal together — anything from pasta nights and "
            "street food themes to elaborate multi-course dinners. The society also runs "
            "occasional cooking workshops led by professional chefs and hosts charity bake "
            "sales throughout the year. All dietary requirements are catered for, and no "
            "cooking experience is needed — just an appetite."
        ),
        'social',
        ['Cooking', 'Food', 'Social', 'Workshop'],
        "Guy's Campus, Great Maze Pond, London SE1 9RT",
    ),
    (
        'Board Game Society',
        'Strategy, luck, and a lot of laughs — board games for every taste.',
        (
            "Board Game Society runs open game nights twice a week in the Nash Fleming "
            "Common Room, with a library of over 150 games available to borrow. Whether "
            "you want to try a 30-minute party game or commit to a three-hour strategy "
            "session, there's always a table for you. The society also runs an annual "
            "Games Weekend — a two-day event open to all members — and enters teams into "
            "the London University Board Game League. It's one of the easiest societies "
            "to drop into mid-term because there's no commitment beyond showing up."
        ),
        'social',
        ['Strategy', 'Party Games', 'Weekly Sessions', 'Tournament'],
        'Nash Fleming Common Room, Strand Campus, London WC2R 2LS',
    ),
    (
        'Travel Society',
        'Explore the world — group trips, travel tips, and adventure planning.',
        (
            "Travel Society organises group trips for students who want to explore beyond "
            "London during term breaks and long weekends. Past destinations have included "
            "Lisbon, Budapest, Edinburgh, and the Amalfi Coast. Beyond organised trips, "
            "we run practical travel evenings covering budgeting, visa processes, and "
            "packing light, and our online community is an active hub for finding travel "
            "companions and sharing recommendations. Membership comes with access to "
            "group discounts on transport and accommodation through our partner network."
        ),
        'social',
        ['Trips', 'Budgeting', 'Adventure', 'Community'],
        None,
    ),
    (
        'Quiz Society',
        'Trivia nights, pub quizzes, and competitive general knowledge.',
        (
            "Quiz Society runs weekly pub quiz nights at a local venue near campus every "
            "Thursday, open to teams of up to six. Questions span general knowledge, "
            "current affairs, science, pop culture, and specialist rounds that rotate "
            "each week. The society also competes in the UK University Quiz Championships "
            "and holds its own internal league table that runs across the full academic "
            "year. New members can join a team or form their own — either way, the evenings "
            "are low-pressure and genuinely fun regardless of how much you know."
        ),
        'social',
        ['Pub Quiz', 'Competition', 'Teams', 'Weekly'],
        'The Lyceum Tavern, 354 Strand, London WC2R 0HS',
    ),

    # Religious (3)
    (
        'Islamic Society',
        "Faith, community, and support for Muslim students at King's.",
        (
            "Islamic Society — KCL ISOC — is one of the largest faith societies at the "
            "university, providing a spiritual home and vibrant community for Muslim students "
            "and anyone interested in learning about Islam. We organise Jumu'ah prayers on "
            "campus, run weekly circles covering Quran recitation, Islamic history, and "
            "contemporary Muslim thought, and hold the annual ISOC dinner which draws "
            "hundreds of attendees each spring. The society also leads a food drive during "
            "Ramadan and coordinates volunteering with local charities. Non-Muslims are "
            "always welcome at our open events."
        ),
        'religious',
        ['Prayer', 'Study Circle', 'Community', 'Charity'],
        'Stamp Room, Strand Campus, London WC2R 2LS',
    ),
    (
        'Christian Union',
        'Faith and fellowship — a community for Christian students at KCL.',
        (
            "Christian Union is a non-denominational community of Christian students that "
            "meets weekly for Bible study, worship, and mutual encouragement. Our main "
            "weekly meeting takes place on Tuesday evenings and draws students from across "
            "the university. Beyond the regular meetings we run a summer mission, an "
            "annual weekend away in the first term, and regular socials that are open to "
            "anyone curious about the Christian faith. We're affiliated with UCCF and "
            "maintain strong links with local churches across London."
        ),
        'religious',
        ['Bible Study', 'Worship', 'Mission', 'Social'],
        'Stamp Room, Strand Campus, London WC2R 2LS',
    ),
    (
        'Hindu Society',
        'Hindu traditions, culture, and community at King\'s College London.',
        (
            "Hindu Society celebrates the richness of Hindu culture through a programme of "
            "religious, cultural, and social events throughout the year. Our calendar "
            "includes Diwali puja, Holi celebrations, and an annual cultural evening "
            "featuring classical music and dance performances. We run weekly spiritual "
            "discussions and yoga sessions, and participate in the national Hindu student "
            "networks through Hind Swaraj. The society is a welcoming space for practising "
            "Hindus and equally for anyone who wants to learn more about one of the "
            "world's oldest and most diverse traditions."
        ),
        'religious',
        ['Puja', 'Festival', 'Yoga', 'Cultural'],
        "Guy's Campus, Great Maze Pond, London SE1 9RT",
    ),

    # Volunteering (3)
    (
        'Environmental Society',
        'Climate action, sustainability, and environmental advocacy at KCL.',
        (
            "Environmental Society is driven by students who want to do more than just "
            "learn about climate change — they want to act on it. We run weekly litter picks "
            "along the South Bank, campaign for greener practices across the university, "
            "and host public lectures from researchers, activists, and policy makers working "
            "on environmental issues. Each term culminates in a larger community project "
            "such as planting sessions in Southwark or a sustainability fair on the Strand. "
            "Members are also connected to London-wide student climate networks and national "
            "environmental organisations for further volunteering opportunities."
        ),
        'volunteering',
        ['Campaign', 'Litter Pick', 'Lectures', 'Community'],
        "Guy's Campus, Great Maze Pond, London SE1 9RT",
    ),
    (
        'Tutoring Society',
        'Help others learn — peer tutoring for local schools and fellow students.',
        (
            "Tutoring Society organises weekly tutoring sessions at secondary schools near "
            "campus, giving KCL students the chance to support GCSE and A-level pupils in "
            "subjects ranging from maths and sciences to English and languages. Tutors are "
            "matched to pupils based on subject expertise and availability, with sessions "
            "typically running for one hour on weekday afternoons. The society also runs "
            "an internal peer tutoring scheme for KCL students who want subject support, "
            "making the exchange genuinely two-directional. It's a rewarding way to "
            "consolidate your own understanding while making a real difference."
        ),
        'volunteering',
        ['Schools', 'Peer Support', 'Teaching', 'Weekly'],
        None,
    ),
    (
        'Mental Health Society',
        'Wellbeing, awareness, and open conversations about mental health.',
        (
            "Mental Health Society works to reduce the stigma around mental health at "
            "university through awareness campaigns, peer support events, and community "
            "building. We run a weekly wellbeing drop-in at the Strand Campus café, train "
            "members in Mental Health First Aid, and organise larger events during "
            "Mental Health Awareness Week each May. The society also advocates directly "
            "to the university on student welfare issues and publishes a termly newsletter "
            "with mental health resources, self-care tips, and member stories. It's a "
            "gentle, non-clinical community — you don't need to be struggling to join."
        ),
        'volunteering',
        ['Wellbeing', 'Awareness', 'Drop-in', 'First Aid'],
        'Strand Campus Café, London WC2R 2LS',
    ),

    # Media (3)
    (
        'Film Society',
        'Cinema lovers unite — screenings, filmmaking, and film criticism at KCL.',
        (
            "Film Society runs weekly film screenings in the lecture theatres on Strand "
            "Campus, covering everything from classic Hollywood to contemporary world "
            "cinema. Each screening is followed by a structured discussion, and the "
            "society publishes reviews and essays in its online journal. Beyond passive "
            "viewing, we run short filmmaking workshops where members pitch, shoot, and "
            "edit their own projects. Our annual Short Film Festival is open to all "
            "entries from KCL students and takes place in the Greenwood Theatre each "
            "June. No film background is needed — just an interest in watching and "
            "talking about cinema."
        ),
        'media',
        ['Screenings', 'Filmmaking', 'Discussion', 'Festival'],
        'Greenwood Theatre, 55 Weston Street, London SE1 3RR',
    ),
    (
        'Newspaper Society',
        "The Strand — King's student newspaper since 1986.",
        (
            "The Strand is KCL's independent student newspaper, run entirely by student "
            "journalists, editors, designers, and photographers. The paper publishes "
            "termly print editions and maintains a live online platform for breaking news "
            "and comment pieces. New members can contribute in whatever role suits them "
            "— writing, photography, illustration, editing, or social media management. "
            "The editorial team meets weekly in the Macadam Building to assign stories "
            "and review copy, and senior editors mentor newer writers throughout the year. "
            "It's an excellent portfolio-builder and a direct route into student journalism "
            "networks across the UK."
        ),
        'media',
        ['Journalism', 'Writing', 'Photography', 'Editing'],
        'Macadam Building, Portugal Street, London WC2A 2JR',
    ),
    (
        'Podcast Society',
        'Audio storytelling — create, record, and publish your own podcasts.',
        (
            "Podcast Society gives students access to professional recording equipment and "
            "the knowledge to use it, all within a collaborative community of audio "
            "storytellers. We run weekly sessions covering interview technique, sound "
            "editing, RSS distribution, and building an audience. Members can launch their "
            "own shows independently or join existing society productions on topics ranging "
            "from current affairs and sports to mental health and music reviews. All "
            "finished episodes are published under the KCL Podcasts umbrella, giving each "
            "show instant visibility within the student community."
        ),
        'media',
        ['Recording', 'Editing', 'Storytelling', 'Production'],
        'Macadam Building, Portugal Street, London WC2A 2JR',
    ),
]


def build_society_seed_data():
    result = []
    for entry in SOCIETY_DATA:
        name, bio, about, category, tags, location_override = entry
        society = build_society_dict(name, bio, about, category, tags, location_override)
        result.append(society)
    return result


def build_society_dict(name, bio, about, category, tags, location_override=None):
    image = get_random_category_image(category)
    mapped_category = CATEGORY_MAPPING.get(category, category)
    location = location_override or CATEGORY_LOCATIONS.get(category, '')
    return {
        'name': name,
        'bio': bio,
        'about': about,
        'categories': [mapped_category],
        'tags': tags,
        'location': location,
        'events': get_events_for_category(category),
        'image': f'http://localhost:8000/static/seed_images/societies/{image}',
    }


def get_random_category_image(category):
    mapped = CATEGORY_MAPPING.get(category, category)
    images = CATEGORY_IMAGES.get(mapped, CATEGORY_IMAGES['social'])
    original_prefix = f'{category}' if category != mapped else None
    original_images = [img for img in images if img.startswith(original_prefix)] if original_prefix else []
    return random.choice(original_images or images)


def build_event_datetime(hour, duration_mins, day_of_week=None):
    base_date = get_next_occurrence(day_of_week)
    start = timezone.make_aware(datetime.combine(base_date, datetime.min.time().replace(hour=hour)))
    end = start + timedelta(minutes=duration_mins)
    return start, end


def get_next_occurrence(day_of_week):
    """Get the next date for a given day of week (0=Mon, 6=Sun)."""
    today = timezone.now().date()
    if day_of_week is None:
        return today + timedelta(days=7)
    days_ahead = day_of_week - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)
