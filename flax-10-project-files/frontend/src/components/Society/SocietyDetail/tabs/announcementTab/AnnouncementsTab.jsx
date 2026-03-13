/**
 * AnnouncementsTab displays a chronological list of society news and updates.
 * Supports pinning, editing, and smooth-scrolling to focused announcements.
 */
import { useState } from "react";
import styles from "../tabs.module.css";
import { formatShortDate } from "../../../../Calendar/utils/dateUtils";
import ImageGalleryModal from "../../imageHandlers/ImageGalleryModal";

export default function AnnouncementsTab({ announcements = [], editMode, tags, focusAnnouncementId, onEdit }) {
    const [gallery, setGallery] = useState(null); // { images, index }
    const openGallery = (imgs, idx) => setGallery({ images: imgs, index: idx });
    return (
        <>
            <AnnouncementsList
                announcements={announcements}
                editMode={editMode}
                onEdit={onEdit}
                tags={tags}
                focusAnnouncementId={focusAnnouncementId}
                onImageClick={openGallery}
            />
            {gallery && (
                <ImageGalleryModal
                    images={gallery.images}
                    initialIndex={gallery.index}
                    onClose={() => setGallery(null)}
                />
            )}
        </>
    );
}

function AnnouncementsList({ announcements, editMode, onEdit, tags, focusAnnouncementId, onImageClick }) {
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
                    onImageClick={onImageClick}
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

const useFocusScroll = (isFocused, ref) => {
    useEffect(() => {
        if (isFocused && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            ref.current.classList.add(styles.highlight);
            setTimeout(() => ref.current?.classList.remove(styles.highlight), 2000);
        }
    }, [isFocused, ref]);
};

function AnnouncementCard({ announcement, editMode, onEdit, tag, isFocused, onImageClick }) {
    const cardRef = useRef(null);
    useFocusScroll(isFocused, cardRef);

    return (
        <div ref={cardRef} id={`announcement-${announcement.id}`}
            className={`${styles.announcementCard} ${announcement.pinned ? styles.pinned : ""}`}>
            {editMode && <EditButton onClick={onEdit} />}
            <CardHeader announcement={announcement} tag={tag} />
            <p className={styles.announcementContent}>{announcement.content}</p>
            <AnnouncementImages announcement={announcement} onImageClick={onImageClick} />
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

import { getImageList } from "./AnnouncementModalHelpers";

function AnnouncementImages({ announcement, onImageClick }) {
    const images = getImageList(announcement);
    if (images.length === 0) return null;

    if (images.length === 1) {
        return <img className={styles.announcementImage} src={images[0]} alt="Announcement"
            onClick={() => onImageClick?.(images, 0)} style={{ cursor: 'pointer' }} />;
    }
    return <ImageGallery images={images} onImageClick={onImageClick} />;
}

function ImageGallery({ images, onImageClick }) {
    return (
        <div className={styles.announcementGallery}>
            {images.map((src, i) => (
                <img key={i} className={styles.galleryImage} src={src} alt={`Image ${i + 1}`}
                    onClick={() => onImageClick?.(images, i)} />
            ))}
        </div>
    );
}

