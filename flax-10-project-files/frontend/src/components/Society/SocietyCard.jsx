import styles from './SocietyCard.module.css';

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return (
        <span className={styles.badge} title="Official Society">✅</span>
    );
}

export default function SocietyCard({ society, onClick }) {
    const cardStyle = { backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${society.image})' };
    return (
        <div className={styles.card} style={cardStyle} onClick={() => onClick(society.id)}>
            <div className={styles.content}>
                <h3 className={styles.name}>{society.name}<RatifiedBadge isRatified={society.is_ratified} /></h3>
                <p className={styles.stats}>{society.member_count} members</p>
            </div>
        </div>
    );
}