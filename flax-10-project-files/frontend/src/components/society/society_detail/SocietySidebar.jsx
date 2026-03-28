/**
 * SocietySidebar displays society about info, pinned announcements, and the upcoming society event.
 * In edit mode, it provides direct actions for creating new content.
 */

import { useState } from "react";
import styles from "./SocietySidebar.module.css";
import AnnouncementModal from "./tabs/announcement_tab/AnnouncementModal";
import { EventModal } from "../../calendar/event_modal/EventModal";
import { formatDateTime } from "../../calendar/utils/dateUtils";

/** Secondary column for highlights and quick actions. */

export default function SocietySidebar({ society, editMode, onAddAnnouncement, onUpdateAnnouncement, onAddEvent, tags }) {
    const [showAnnounce, setShowAnnounce] = useState(false);
    const [showEvent, setShowEvent] = useState(false);

    return (
        <aside className={styles.sidebar}>
            <SidebarContent society={society} editMode={editMode} />
            {editMode && <AddButtons onAnnouncement={() => setShowAnnounce(true)} onEvent={() => setShowEvent(true)} />}
            {showAnnounce && <SidebarAnnouncementModal society={society} tags={tags}
                onAdd={onAddAnnouncement} onUpdate={onUpdateAnnouncement} onClose={() => setShowAnnounce(false)} />}
            {showEvent && <EventModal onClose={() => setShowEvent(false)} showReminder={false} showTagManager={false}
                customTags={tags} onSubmit={(d) => { onAddEvent?.(d); setShowEvent(false); }} />}
        </aside>
    );
}

/** Specific wrapper for sidebar announcement logic. */

function SidebarAnnouncementModal({ society, tags, onAdd, onUpdate, onClose }) {
    const handleSubmit = (data, conflicting) => {
        if (conflicting) onUpdate?.(conflicting.id, { ...conflicting, pinned: false });
        onAdd?.(data);
        onClose();
    };
    return <AnnouncementModal onClose={onClose} onSubmit={handleSubmit}
        tags={tags} societyId={society.id} announcements={society.announcements} />;
}

function SidebarContent({ society, editMode }) {
    const pinned = society.announcements?.find(a => a.pinned);
    const next = society.events?.[0];
    const hasAbout = society.about || society.admin_emails;
    if (!hasAbout && !pinned && !next && !editMode) return <EmptyMessage />;
    return (
        <>
            {pinned && <PinnedSection announcement={pinned} />}
            {hasAbout && <AboutSection about={society.about} adminEmails={society.admin_emails} />}
            {next && <UpcomingSection event={next} />}
        </>
    );
}

function AboutSection({ about, adminEmails }) {
    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>About</h4>
            {about && <p className={styles.aboutText}>{about}</p>}
            {adminEmails && <AdminContact emails={adminEmails} />}
        </div>
    );
}

function AdminContact({ emails }) {
    const list = emails.split(",").map(e => e.trim());
    return (
        <div className={styles.adminContact}>
            <span className={styles.adminLabel}>Admin:</span>
            {list.map((email, i) => (
                <a key={i} href={`mailto:${email}`} className={styles.adminEmail}>{email}</a>
            ))}
        </div>
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
            <p className={styles.eventDate}>{formatDateTime(new Date(event.start_time))}</p>
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
