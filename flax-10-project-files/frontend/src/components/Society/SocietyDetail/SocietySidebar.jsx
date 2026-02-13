import styles from "./SocietySidebar.module.css";

export default function SocietySidebar({ details }) {
    const pinnedAnnouncement = details.announcements?.find(a => a.pinned);
    const nextEvent = details.upcomingEvents?.[0];

    return (
        <aside className={styles.sidebar}>
            {pinnedAnnouncement && <PinnedSection announcement={pinnedAnnouncement} />}
            {nextEvent && <UpcomingSection event={nextEvent} />}
            {!pinnedAnnouncement && !nextEvent && <EmptySidebar />}
        </aside>
    );
}

function PinnedSection({ announcement }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Pinned</h4>
            <p className={styles.pinnedTitle}>{announcement.title}</p>
            <p className={styles.pinnedContent}>{announcement.content}</p>
        </div>
    );
}

function UpcomingSection({ event }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Up Next</h4>
            <p className={styles.eventTitle}>{event.title}</p>
            <p className={styles.eventDate}>{formatEventDate(event)}</p>
        </div>
    );
}

function EmptySidebar() {
    return <p className={styles.empty}>No pinned items or upcoming events.</p>;
}

function formatEventDate(event) {
    const date = new Date(event.date);
    const options = { weekday: "short", day: "numeric", month: "short" };
    return `${date.toLocaleDateString("en-GB", options)} at ${event.time}`;
}
