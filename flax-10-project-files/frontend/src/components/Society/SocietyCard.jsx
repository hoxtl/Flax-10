import styles from './SocietyCard.module.css';

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return (
        <span className={styles.badge} title="Official Society">✅</span>
    );
}

export default function SocietyCard({ society, onClick }) {
    const imageUrl = society.cover_image || society.image;
    const bg = imageUrl ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)), url(${imageUrl})` } : {};
    const cardClass = imageUrl ? styles.card : `${styles.card} ${styles.noImage}`;
    return (
        <div className={cardClass} style={bg} onClick={() => onClick?.(society)}>
            <div className={styles.info}>
                <h3 className={styles.name}>{society.name}<RatifiedBadge isRatified={society.is_ratified} /></h3>
                <p className={styles.count}>{society.member_count} members</p>
            </div>
        </div>
    );
}