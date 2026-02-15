import styles from "./SocietySidebar.module.css";

export default function SocietySidebar({ details, editMode }) {
    const pinnedAnnouncement = details.announcements?.find(a => a.pinned);
    const nextEvent = details.upcomingEvents?.[0];

    return (
        <aside className={styles.sidebar}>
            {pinnedAnnouncement && <PinnedSection announcement={pinnedAnnouncement} editMode={editMode} />}
            {nextEvent && <UpcomingSection event={nextEvent} editMode={editMode} />}
            {!pinnedAnnouncement && !nextEvent && <EmptySidebar editMode={editMode} />}
            {editMode && <AddButtons />}
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

function EmptySidebar({ editMode }) {
    if (editMode) return null;
    return <p className={styles.empty}>No pinned items or upcoming events.</p>;
}

function AddButtons() {
    return (
        <div className={styles.addButtons}>
            <button className={styles.addBtn} onClick={() => console.log("Add announcement")}>+ Add Announcement</button>
            <button className={styles.addBtn} onClick={() => console.log("Add event")}>+ Add Event</button>
        </div>
    );
}

function formatEventDate(event) {
    const date = new Date(event.date);
    const options = { weekday: "short", day: "numeric", month: "short" };
    return `${date.toLocaleDateString("en-GB", options)} at ${event.time}`;
}
