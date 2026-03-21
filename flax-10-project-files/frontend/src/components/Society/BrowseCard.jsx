/*
 * BrowseCard renders a compact society browse card.
 */
import styles from './BrowseCard.module.css';
import ActionCard from './ActionCard';

export default function BrowseCard({ onClick, societies = [] }) {
    const images = societies.slice(0, 4).map(s => s.cover_image || s.image);
    return (
        <ActionCard onClick={onClick} text="🔎 Find new society">
            <ImageGrid images={images} />
        </ActionCard>
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
    return <div className={styles.gridItem} style={{ backgroundImage: `url("${src}")` }} />;
}
