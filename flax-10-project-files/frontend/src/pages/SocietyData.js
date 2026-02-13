// TODO: Replace with actual societies (seeded / added from backend)
export const MOCK_SOCIETIES = [
    { id: 1, name: "Robotics Society", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", isRatified: true, memberCount: 150, isAdmin: true, isPrivate: false },
    { id: 2, name: "Computing Society", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97", isRatified: true, memberCount: 1200, isAdmin: false, isPrivate: false },
    { id: 3, name: "Chess Club", image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b", isRatified: false, memberCount: 45, isAdmin: false, isPrivate: true }
];

// TODO: Replace with backend data
export const MOCK_SOCIETY_DETAILS = {
    1: {
        bio: "Building the future, one robot at a time. Weekly workshops, competitions, and hackathons.",
        about: "The Robotics Society brings together students passionate about robotics, AI, and engineering. We host weekly workshops, participate in national competitions, and collaborate on exciting projects.",
        dateCreated: "2019-09-15",
        images: [
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
            "https://images.unsplash.com/photo-1531746790731-6c087fecd65a",
            "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb"
        ],
        announcements: [
            { id: 1, title: "Competition Results", content: "We placed 2nd at the National Robotics Challenge!", date: "2026-02-10", pinned: true },
            { id: 2, title: "Workshop Tomorrow", content: "Join us for an intro to Arduino session.", date: "2026-02-12", pinned: false }
        ],
        upcomingEvents: [
            { id: 101, title: "Arduino Workshop", date: "2026-02-14", time: "14:00" },
            { id: 102, title: "Team Meeting", date: "2026-02-16", time: "18:00" }
        ],
        isMember: true
    },
    2: {
        bio: "Code, connect, create. The largest tech community on campus.",
        about: "Computing Society is the go-to community for all things tech. From coding workshops to hackathons, career talks to game nights, we've got something for everyone.",
        dateCreated: "2015-01-20",
        images: [
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
            "https://images.unsplash.com/photo-1504639725590-34d0984388bd",
            "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
        ],
        announcements: [
            { id: 3, title: "Hackathon Sign-ups Open", content: "Register for our annual 24-hour hackathon!", date: "2026-02-08", pinned: true }
        ],
        upcomingEvents: [
            { id: 201, title: "Python Basics", date: "2026-02-15", time: "16:00" }
        ],
        isMember: true
    },
    3: {
        bio: "Checkmate your stress. Casual and competitive chess for all levels.",
        about: "Whether you're a grandmaster or just learning the moves, Chess Club welcomes you. Weekly meetups, tournaments, and puzzle sessions.",
        dateCreated: "2020-10-01",
        images: [
            "https://images.unsplash.com/photo-1529699211952-734e80c4d42b",
            "https://images.unsplash.com/photo-1560174038-da43ac74f01b"
        ],
        announcements: [],
        upcomingEvents: [
            { id: 301, title: "Weekly Meetup", date: "2026-02-17", time: "19:00" }
        ],
        isMember: false
    }
};