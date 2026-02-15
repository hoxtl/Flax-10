import { useState } from "react";
import styles from "./tabs.module.css";
import AnnouncementModal from "../AnnouncementModal";

export default function AnnouncementsTab({ details, editMode, onUpdate, tags }) {
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const announcements = details.announcements || [];

    const handleSave = (data) => { saveAnnouncement(data, details, onUpdate); setEditingAnnouncement(null); };

    return (
        <>
            <AnnouncementsList announcements={announcements} editMode={editMode} onEdit={setEditingAnnouncement} tags={tags} />
            {editingAnnouncement && <AnnouncementModal announcement={editingAnnouncement} tags={tags}
                onClose={() => setEditingAnnouncement(null)} onSubmit={handleSave} />}
        </>
    );
}

function saveAnnouncement(data, details, onUpdate) {
    const existing = details.announcements || [];
    const updated = data.id ? existing.map(a => a.id === data.id ? formatAnnouncement(data) : a) : [...existing, formatAnnouncement(data)];
    onUpdate?.({ announcements: updated });
}

function formatAnnouncement(data) {
    return { id: data.id || Date.now(), title: data.title, content: data.content, images: data.images,
        image: data.images?.[0] || null, tagId: data.tagId, date: new Date().toISOString().split('T')[0], pinned: data.pinned };
}

function AnnouncementsList({ announcements, editMode, onEdit, tags }) {
    if (announcements.length === 0) return <EmptyAnnouncements editMode={editMode} />;
    return (
        <div className={styles.announcementList}>
            {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} editMode={editMode} onEdit={() => onEdit(a)} tag={tags?.find(t => t.id === a.tagId)} />)}
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
            <span className={styles.announcementDate}>{formatDate(announcement.date)}</span>
        </div>
    );
}

function AnnouncementImages({ announcement }) {
    const images = announcement.images || (announcement.image ? [announcement.image] : []);
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

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
