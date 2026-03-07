import styles from './SocietyCard.module.css';
import { Flag } from "lucide-react";

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return (
        <span className={styles.badge} title="Official Society">✅</span>
    );
}

export default function SocietyCard({ society, onClick, onReport, onUnreport }) {
    const imageUrl = society.cover_image || society.image;
    const bg = imageUrl ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)), url(${imageUrl})` } : {};
    const cardClass = imageUrl ? styles.card : `${styles.card}`;
    const reported = society.has_reported;

    const handleReport = (e) => {
        e.stopPropagation();
        if (reported) {
            onUnreport?.(society);
        } else {
            onReport?.(society);
        }
    };

    const content = (
        <div className={styles.info}>
            <h3 className={styles.name}>{society.name}<RatifiedBadge isRatified={society.is_ratified} /></h3>
            <p className={styles.count}>{society.member_count} members</p>
        </div>
    );

    return (
        <div className={cardClass} style={bg} onClick={() => onClick?.(society)}>
            <button
                className={`${styles.reportBtn} ${reported ? styles.reported : ''}`}
                onClick={handleReport}
                title={reported ? "You have reported this society. Click to unreport." : "Report society"}
            >
                <Flag size={16} fill={reported ? "currentColor" : "none"} strokeWidth={reported ? 1 : 2} />
            </button>
            {imageUrl ? content : <div className={styles.overlay}>{content}</div>}
        </div>
    );
}