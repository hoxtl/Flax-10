/*
 * SocietyCard composes the interactive shell for a society browse card.
 */

import styles from './SocietyCard.module.css';
import GridCard from '../common/card/GridCard';
import { Flag, BadgeCheck } from "lucide-react";
import { SocietyCardContent } from "./SocietyCardContent";

/** Displays a verified icon for officially ratified societies. */

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return <BadgeCheck className={styles.verifiedIcon} size={22} title="Official Society" aria-label="Official Society" />;
}

/** Interactive card component for society directory listings. */

export default function SocietyCard({ society, onClick, onReport, onUnreport }) {
    const imageUrl = society.cover_image || society.image;
    const bg = imageUrl ? { backgroundImage: `linear-gradient(color-mix(in srgb, black 20%, transparent), color-mix(in srgb, black 60%, transparent)), url(${imageUrl})` } : {};

    return (
        <GridCard className={styles.card} style={bg} onClick={() => onClick?.(society.id)}>
            <ReportAction society={society} onReport={onReport} onUnreport={onUnreport} />
            <SocietyCardContent society={society} hasImage={!!imageUrl} RatifiedBadge={RatifiedBadge} />
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
