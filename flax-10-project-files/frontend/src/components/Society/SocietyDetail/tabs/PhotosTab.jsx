import styles from "./tabs.module.css";

export default function PhotosTab({ details }) {
    const images = details.images || [];
    if (images.length === 0) return <EmptyPhotos />;

    return (
        <div className={styles.photoGrid}>
            {images.map((img, i) => <PhotoCard key={i} src={img} />)}
        </div>
    );
}

function EmptyPhotos() {
    return <p className={styles.empty}>No photos yet.</p>;
}

function PhotoCard({ src }) {
    return <div className={styles.photoCard} style={{ backgroundImage: `url(${src})` }} />;
}
