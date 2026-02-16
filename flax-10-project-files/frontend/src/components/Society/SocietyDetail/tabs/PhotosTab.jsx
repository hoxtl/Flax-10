import { useState } from "react";
import styles from "./tabs.module.css";
import ImageGalleryModal from "../imageHandlers/ImageGalleryModal";
import AddPhotoModal from "../imageHandlers/AddPhotoModal";
import DeletePhotoModal from "../imageHandlers/DeletePhotoModal";

export default function PhotosTab({ society, editMode, onUpdate }) {
    const allPhotos = collectAllPhotos(society);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleConfirmDelete = (action) => {
        const updates = performDelete(deleteTarget, action, society);
        onUpdate?.(updates);
        setDeleteTarget(null);
    };

    return (
        <>
            <PhotoContent photos={allPhotos} editMode={editMode} onPhotoClick={setSelectedIndex}
                onAddClick={() => setAddModal(true)} onDelete={setDeleteTarget} />
            {selectedIndex !== null && <ImageGalleryModal images={allPhotos.map(p => p.src)} initialIndex={selectedIndex} onClose={() => setSelectedIndex(null)} />}
            {addModal && <AddPhotoModal onClose={() => setAddModal(false)} onAdd={(d) => { handleAdd(d, society, onUpdate); setAddModal(false); }} />}
            {deleteTarget && <DeletePhotoModal photo={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />}
        </>
    );
}

function handleAdd({ url, addToCover }, society, onUpdate) {
    const currentImages = (society.images || []).map(i => i.url || i);
    onUpdate?.({ images: [...currentImages, url] });
}

function performDelete(photo, action, society) {
    const { src } = photo;
    const currentImages = (society.images || []).map(i => i.url || i);
    if (action === 'delete' || action === 'both') return { images: currentImages.filter(img => img !== src) };
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

function collectAllPhotos(society) {
    const photos = [];
    const seen = new Set();

    (society.images || []).forEach(img => {
        const url = img.url || img;
        if (!seen.has(url)) { seen.add(url); photos.push({ src: url, source: 'cover' }); }
    });

    (society.announcements || []).forEach(a => {
        (a.images || []).forEach(img => {
            const url = img.url || img;
            if (!seen.has(url)) { seen.add(url); photos.push({ src: url, source: 'announcement' }); }
        });
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
