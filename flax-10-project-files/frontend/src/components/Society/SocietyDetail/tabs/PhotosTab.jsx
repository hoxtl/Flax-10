import styles from "./tabs.module.css";

export default function PhotosTab({ details }) {
    const allPhotos = collectAllPhotos(details);
    if (allPhotos.length === 0) return <EmptyPhotos />;

    return (
        <div className={styles.photoGrid}>
            {allPhotos.map((img, i) => <PhotoCard key={i} src={img} />)}
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

function PhotoCard({ src }) {
    return <div className={styles.photoCard} style={{ backgroundImage: `url(${src})` }} />;
}
