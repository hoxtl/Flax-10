import styles from "./tabs.module.css";

export default function AnnouncementsTab({ details }) {
    const announcements = details.announcements || [];
    if (announcements.length === 0) return <EmptyAnnouncements />;

    return (
        <div className={styles.announcementList}>
            {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
        </div>
    );
}

function EmptyAnnouncements() {
    return <p className={styles.empty}>No announcements yet.</p>;
}

function AnnouncementCard({ announcement }) {
    return (
        <div className={`${styles.announcementCard} ${announcement.pinned ? styles.pinned : ""}`}>
            <CardHeader announcement={announcement} />
            <p className={styles.announcementContent}>{announcement.content}</p>
        </div>
    );
}

function CardHeader({ announcement }) {
    return (
        <div className={styles.announcementHeader}>
            <h4 className={styles.announcementTitle}>{announcement.title}</h4>
            {announcement.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
            <span className={styles.announcementDate}>{formatDate(announcement.date)}</span>
        </div>
    );
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
