import { useState } from "react";
import styles from "./tabs.module.css";
import ImageGalleryModal from "../ImageGalleryModal";

export default function PhotosTab({ details }) {
    const allPhotos = collectAllPhotos(details);
    const [selectedIndex, setSelectedIndex] = useState(null);

    if (allPhotos.length === 0) return <EmptyPhotos />;

    return (
        <>
            <PhotoGrid photos={allPhotos} onPhotoClick={setSelectedIndex} />
            {selectedIndex !== null && <ImageGalleryModal images={allPhotos} initialIndex={selectedIndex} onClose={() => setSelectedIndex(null)} />}
        </>
    );
}

function PhotoGrid({ photos, onPhotoClick }) {
    return (
        <div className={styles.photoGrid}>
            {photos.map((img, i) => <PhotoCard key={i} src={img} onClick={() => onPhotoClick(i)} />)}
        </div>
    );
}

function collectAllPhotos(details) {
    const heroImages = details.images || [];
    const generalPhotos = details.photos || [];
    const announcementPhotos = (details.announcements || []).filter(a => a.image).map(a => a.image);
    return [...heroImages, ...generalPhotos, ...announcementPhotos];
}

function EmptyPhotos() {
    return <p className={styles.empty}>No photos yet.</p>;
}

function PhotoCard({ src, onClick }) {
    return <div className={styles.photoCard} style={{ backgroundImage: `url(${src})` }} onClick={onClick} />;
}
