import { useState } from "react";
import styles from "../tabs.module.css";
import { formatShortDate } from "../../../../Calendar/utils/dateUtils";
export default function AnnouncementsTab({ announcements = [], editMode, tags, focusAnnouncementId, onEdit }) {
    return (
        <AnnouncementsList announcements={announcements} editMode={editMode} onEdit={onEdit} tags={tags} focusAnnouncementId={focusAnnouncementId} />
    );
}

function saveAnnouncement(data, handlers, conflictingAnnouncement) {
    if (conflictingAnnouncement) {
        handlers?.onUpdate?.(conflictingAnnouncement.id, { ...conflictingAnnouncement, pinned: false });
    }
    if (data.id) return handlers?.onUpdate?.(data.id, data);
    return handlers?.onAdd?.(data);
}

export { saveAnnouncement };

function AnnouncementsList({ announcements, editMode, onEdit, tags, focusAnnouncementId }) {
    if (announcements.length === 0) return <EmptyAnnouncements editMode={editMode} />;

    return (
        <div className={styles.announcementList}>
            {announcements.map(a => (
                <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    editMode={editMode}
                    onEdit={() => onEdit(a)}
                    tag={tags?.find(t => t.id === a.tag)}
                    isFocused={String(a.id) === String(focusAnnouncementId)}
                />
            ))}
        </div>
    );
}

function EmptyAnnouncements({ editMode }) {
    if (editMode) return <p className={styles.empty}>No announcements yet. Use the sidebar to add one.</p>;
    return <p className={styles.empty}>No announcements yet.</p>;
}

import { useEffect, useRef } from "react";

function AnnouncementCard({ announcement, editMode, onEdit, tag, isFocused }) {
    const cardRef = useRef(null);
    useEffect(() => {
        if (isFocused && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardRef.current.classList.add(styles.highlight);
            setTimeout(() => cardRef.current?.classList.remove(styles.highlight), 2000);
        }
    }, [isFocused]);

    return (
        <div ref={cardRef} id={`announcement-${announcement.id}`} className={`${styles.announcementCard} ${announcement.pinned ? styles.pinned : ""}`}>
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
    const images = (announcement.images || []).map(i => i.url || i);
    if (images.length === 0) return null;
    if (images.length === 1) return <img className={styles.announcementImage} src={images[0]} alt="Announcement" />;
    return <ImageGallery images={images} />;
}

function ImageGallery({ images }) {
    return (
        <div className={styles.announcementGallery}>
            {images.map((src, i) => <img key={i} className={styles.galleryImage} src={src} alt={`Image ${i + 1}`} />)}
        </div>
    );
}

