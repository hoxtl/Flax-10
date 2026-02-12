import styles from './SocietyCard.module.css';

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return (
        <span className={styles.badge} title="Official Society">✅</span>
    );
}

export default function SocietyCard({ society, onClick }) {
    const bg = { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)), url(${society.image})` };
    return (
        <div className={styles.card} style={bg} onClick={() => onClick?.(society.id)}>
            <div className={styles.info}>
                <h3 className={styles.name}>{
                    society.name}
                    <RatifiedBadge isRatified={society.isRatified} />
                </h3>
                <p className={styles.count}>{society.memberCount} members</p>
            </div>
        </div>
    );
}