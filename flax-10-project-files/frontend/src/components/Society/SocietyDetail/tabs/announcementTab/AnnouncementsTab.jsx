import { useState } from "react";
import styles from "../tabs.module.css";
import AnnouncementModal from "./AnnouncementModal";
import { formatShortDate } from "../../../../Calendar/utils/dateUtils";

export default function AnnouncementsTab({ announcements = [], editMode, onUpdate, tags }) {
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const handleSave = (data) => { saveAnnouncement(data, announcements, onUpdate); setEditingAnnouncement(null); };

    return (
        <>
            <AnnouncementsList announcements={announcements} editMode={editMode} onEdit={setEditingAnnouncement} tags={tags} />
            {editingAnnouncement && <AnnouncementModal announcement={editingAnnouncement} tags={tags}
                onClose={() => setEditingAnnouncement(null)} onSubmit={handleSave} />}
        </>
    );
}

function saveAnnouncement(data, existing, onUpdate) {
    const updated = data.id ? existing.map(a => a.id === data.id ? formatAnnouncement(data) : a) : [...existing, formatAnnouncement(data)];
    onUpdate?.({ announcements: updated });
}

function formatAnnouncement(data) {
    return {
        id: data.id || Date.now(), title: data.title, content: data.content,
        image_urls: data.images || [], tag: data.tag, pinned: data.pinned
    };
}

function AnnouncementsList({ announcements, editMode, onEdit, tags }) {
    if (announcements.length === 0) return <EmptyAnnouncements editMode={editMode} />;
    return (
        <div className={styles.announcementList}>
            {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} editMode={editMode} onEdit={() => onEdit(a)} tag={tags?.find(t => t.id === a.tag)} />)}
        </div>
    );
}

function EmptyAnnouncements({ editMode }) {
    if (editMode) return <p className={styles.empty}>No announcements yet. Use the sidebar to add one.</p>;
    return <p className={styles.empty}>No announcements yet.</p>;
}

function AnnouncementCard({ announcement, editMode, onEdit, tag }) {
    return (
        <div className={`${styles.announcementCard} ${announcement.pinned ? styles.pinned : ""}`}>
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

