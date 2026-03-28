/**
 * AnnouncementsTab displays a chronological list of society news and updates.
 * Supports pinning, editing, and smooth-scrolling to focused announcements.
 */

import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import styles from "../tabs.module.css";
import { formatShortDate } from "../../../../calendar/utils/dateUtils";
import SearchEmptyState from "../../../../common/search_empty_state/SearchEmptyState";
import { getImageList } from "./announcementModalHelpers";

export default function AnnouncementsTab({ announcements = [], editMode, tags, focusAnnouncementId, onEdit }) {
    return <AnnouncementsList {...{ announcements, editMode, onEdit, tags, focusAnnouncementId }} />;
}

function AnnouncementsList({ announcements, editMode, onEdit, tags, focusAnnouncementId }) {
    if (announcements.length === 0) return <EmptyAnnouncements editMode={editMode} />;
    return (
        <div className={styles.announcementList}>
            {announcements.map(a => (
                <AnnouncementCard key={a.id} announcement={a} editMode={editMode} onEdit={() => onEdit(a)}
                    tag={tags?.find(t => t.id === a.tag)} isFocused={String(a.id) === String(focusAnnouncementId)} />
            ))}
        </div>
    );
}

function EmptyAnnouncements({ editMode }) {
    return (
        <SearchEmptyState
            className={styles.announcementEmptyState}
            title="No announcements yet"
            hint={editMode ? "Use the sidebar to post the first update for this society." : "Check back soon for society updates, reminders, and event news."}
            itemLabel="announcements"
            icon={<Megaphone size={22} aria-hidden="true" />}
        />
    );
}

function useFocusScroll(isFocused, ref) {
    useEffect(() => {
        if (!isFocused || !ref.current) return;
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.current.classList.add(styles.highlight);
        setTimeout(() => ref.current?.classList.remove(styles.highlight), 2000);
    }, [isFocused, ref]);
}

function AnnouncementCard({ announcement, editMode, onEdit, tag, isFocused }) {
    const cardRef = useRef(null);
    useFocusScroll(isFocused, cardRef);
    const cardClass = `${styles.announcementCard} ${announcement.pinned ? styles.pinned : ""}`;
    return (
        <div ref={cardRef} id={`announcement-${announcement.id}`} className={cardClass}>
            {editMode && <EditButton onClick={onEdit} />}
            <CardHeader announcement={announcement} tag={tag} />
            <p className={styles.announcementContent}>{announcement.content}</p>
            <AnnouncementImages announcement={announcement} />
        </div>
    );
}

function EditButton({ onClick }) {
    return <button className={styles.editAnnouncementBtn} onClick={onClick} title="Edit">✎</button>;
}

function CardHeader({ announcement, tag }) {
    return (
        <div className={styles.announcementHeader}>
            <h4 className={styles.announcementTitle}>{announcement.title}</h4>
            {tag && <span className={styles.tagBadge} style={{ backgroundColor: tag.color }}>{tag.label}</span>}
            {announcement.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
            <span className={styles.announcementDate}>{formatShortDate(new Date(announcement.created_at))}</span>
        </div>
    );
}

function AnnouncementImages({ announcement }) {
    const images = getImageList(announcement);
    if (images.length === 0) return null;
    return <img className={styles.announcementImage} src={images[0]} alt="Announcement" />;
}
