import styles from './BrowseCard.module.css';

export default function BrowseCard({ onClick, societies = [] }) {
    const images = societies.slice(0, 4).map(s => s.cover_image || s.image);
    return (
        <div className={styles.card} onClick={onClick}>
            <ImageGrid images={images} />
            <div className={styles.overlay}>
                <span className={styles.text}>🔎 Find new society</span>
            </div>
        </div>
    );
}

function ImageGrid({ images }) {
    if (images.length === 0) return <div className={styles.emptyGrid} />;
    return (
        <div className={styles.imageGrid}>
            {images.map((img, i) => <GridImage key={i} src={img} />)}
        </div>
    );
}

function GridImage({ src }) {
    return <div className={styles.gridItem} style={{ backgroundImage: `url(${src})` }} />;
}
