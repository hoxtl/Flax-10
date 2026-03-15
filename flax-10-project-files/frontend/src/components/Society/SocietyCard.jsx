/**
 * SocietyCard renders a visual summary of a society, including its cover image,
 * name, membership count, and a quick-report action.
 */
import styles from './SocietyCard.module.css';
import GridCard from '../common/Card/GridCard';
import { Flag, BadgeCheck } from "lucide-react";

/** Displays a verified icon for officially ratified societies. */
function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return <BadgeCheck className={styles.verifiedIcon} size={22} title="Ratified Society" aria-label="Ratified Society" />;
}

/** Interactive card component for society directory listings. */
export default function SocietyCard({ society, onClick, onReport, onUnreport }) {
    const imageUrl = society.cover_image || society.image;
    const bg = imageUrl ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)), url(${imageUrl})` } : {};

    return (
        <GridCard className={styles.card} style={bg} onClick={() => onClick?.(society.id)}>
            <ReportAction society={society} onReport={onReport} onUnreport={onUnreport} />
            <CardContent society={society} hasImage={!!imageUrl} />
        </GridCard>
    );
}

/** Handles the report/unreport button logic and state. */
function ReportAction({ society, onReport, onUnreport }) {
    const reported = society.has_reported;
    const handleClick = (e) => {
        e.stopPropagation();
        if (reported) onUnreport?.(society); else onReport?.(society);
    };

    return (
        <button className={`${styles.reportBtn} ${reported ? styles.reported : ''}`}
            onClick={handleClick}
            title={reported ? "You have reported this society. Click to unreport." : "Report society"}>
            <Flag size={16} fill={reported ? "currentColor" : "none"} strokeWidth={reported ? 1 : 2} />
        </button>
    );
}

/** Renders the text info and overlays for the society card. */
function CardContent({ society, hasImage }) {
    const info = (
        <div className={styles.info}>
            <h3 className={styles.name}>{society.name}<RatifiedBadge isRatified={society.is_ratified} /></h3>
            <p className={styles.count}>{society.member_count} members</p>
        </div>
    );
    return hasImage ? info : <div className={styles.overlay}>{info}</div>;
}
