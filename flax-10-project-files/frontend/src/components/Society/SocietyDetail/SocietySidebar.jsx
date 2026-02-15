import { useState } from "react";
import styles from "./SocietySidebar.module.css";
import AnnouncementModal from "./AnnouncementModal";
import { EventModal } from "../../Calendar/EventModal/EventModal";

export default function SocietySidebar({ details, editMode, onAddAnnouncement, onAddEvent, tags }) {
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);

    return (
        <aside className={styles.sidebar}>
            <SidebarContent pinned={details.announcements?.find(a => a.pinned)} next={details.upcomingEvents?.[0]} editMode={editMode} />
            {editMode && <AddButtons onAnnouncement={() => setShowAnnouncementModal(true)} onEvent={() => setShowEventModal(true)} />}
            {showAnnouncementModal && <AnnouncementModal onClose={() => setShowAnnouncementModal(false)} onSubmit={(d) => { onAddAnnouncement?.(d); setShowAnnouncementModal(false); }} tags={tags} />}
            {showEventModal && <EventModal onClose={() => setShowEventModal(false)} showReminder={false} customTags={tags} onSubmit={(d) => { onAddEvent?.(d); setShowEventModal(false); }} />}
        </aside>
    );
}

function SidebarContent({ pinned, next, editMode }) {
    if (!pinned && !next && !editMode) return <EmptyMessage />;
    return (
        <>
            {pinned && <PinnedSection announcement={pinned} />}
            {next && <UpcomingSection event={next} />}
        </>
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

function EmptyMessage() {
    return <p className={styles.empty}>No pinned items or upcoming events.</p>;
}

function AddButtons({ onAnnouncement, onEvent }) {
    return (
        <div className={styles.addButtons}>
            <button className={styles.addBtn} onClick={onAnnouncement}>+ Add Announcement</button>
            <button className={styles.addBtn} onClick={onEvent}>+ Add Event</button>
        </div>
    );
}

function formatEventDate(event) {
    const date = new Date(event.date);
    const options = { weekday: "short", day: "numeric", month: "short" };
    return `${date.toLocaleDateString("en-GB", options)} at ${event.time}`;
}
