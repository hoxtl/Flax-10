import { useState } from "react";
import styles from "./tabs.module.css";
import ImageGalleryModal from "../ImageGalleryModal";
import AddPhotoModal from "../AddPhotoModal";
import DeletePhotoModal from "../DeletePhotoModal";

export default function PhotosTab({ details, editMode, onUpdate }) {
    const allPhotos = collectAllPhotos(details);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleConfirmDelete = (action) => {
        const updates = performDelete(deleteTarget, action, details);
        onUpdate?.(updates);
        setDeleteTarget(null);
    };

    return (
        <>
            <PhotoContent photos={allPhotos} editMode={editMode} onPhotoClick={setSelectedIndex}
                onAddClick={() => setAddModal(true)} onDelete={setDeleteTarget} />
            {selectedIndex !== null && <ImageGalleryModal images={allPhotos.map(p => p.src)} initialIndex={selectedIndex} onClose={() => setSelectedIndex(null)} />}
            {addModal && <AddPhotoModal onClose={() => setAddModal(false)} onAdd={(d) => { handleAdd(d, details, onUpdate); setAddModal(false); }} />}
            {deleteTarget && <DeletePhotoModal photo={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />}
        </>
    );
}

function handleAdd({ url, addToCover }, details, onUpdate) {
    const updates = { photos: [...(details.photos || []), url] };
    if (addToCover) updates.images = [...(details.images || []), url];
    onUpdate?.(updates);
}

function performDelete(photo, action, details) {
    const { src } = photo;
    if (action === 'hide') return { hiddenPhotos: [...(details.hiddenPhotos || []), src] };
    if (action === 'delete') return { photos: (details.photos || []).filter(p => p !== src) };
    if (action === 'photos_only') return { photos: (details.photos || []).filter(p => p !== src) };
    if (action === 'both') return {
        photos: (details.photos || []).filter(p => p !== src),
        images: (details.images || []).filter(img => img !== src)
    };
    return {};
}

function PhotoContent({ photos, editMode, onPhotoClick, onAddClick, onDelete }) {
    if (photos.length === 0 && !editMode) return <EmptyPhotos />;
    return <PhotoGrid photos={photos} editMode={editMode} onPhotoClick={onPhotoClick} onAddClick={onAddClick} onDelete={onDelete} />;
}

function PhotoGrid({ photos, editMode, onPhotoClick, onAddClick, onDelete }) {
    return (
        <div className={styles.photoGrid}>
            {editMode && <AddPhotoCard onClick={onAddClick} />}
            {photos.map((item, i) => (
                <PhotoCard key={i} src={item.src}
                    onClick={() => onPhotoClick(editMode ? i : i)}
                    onDelete={editMode ? () => onDelete(item) : undefined} />
            ))}
        </div>
    );
}

function AddPhotoCard({ onClick }) {
    return (
        <div className={`${styles.photoCard} ${styles.addPhotoCard}`} onClick={onClick}>
            <span className={styles.addIcon}>+</span>
            <span className={styles.addLabel}>Add Photo</span>
        </div>
    );
}

function collectAllPhotos(details) {
    const hidden = new Set(details.hiddenPhotos || []);
    const photos = [];

    (details.images || []).forEach(img => {
        if (!hidden.has(img)) photos.push({ src: img, source: 'cover' });
    });

    (details.photos || []).forEach(img => {
        // Avoid duplicates if same image is in cover and photos
        if (!photos.some(p => p.src === img) && !hidden.has(img)) {
            photos.push({ src: img, source: 'general' });
        }
    });

    (details.announcements || []).forEach(a => {
        if (a.image && !hidden.has(a.image) && !photos.some(p => p.src === a.image)) {
            photos.push({ src: a.image, source: 'announcement' });
        }
    });

    return photos;
}

function EmptyPhotos() {
    return <p className={styles.empty}>No photos yet.</p>;
}

function PhotoCard({ src, onClick, onDelete }) {
    return (
        <div className={styles.photoCard} style={{ backgroundImage: `url(${src})` }} onClick={onClick}>
            {onDelete && (
                <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    &times;
                </button>
            )}
        </div>
    );
}
