/*
 * SocietyCard composes the interactive shell for a society browse card.
 */

import styles from '../styles/SocietyCard.module.css';
import GridCard from '../../common/card/GridCard';
import { Flag, BadgeCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SocietyCardContent } from "./SocietyCardContent";
import Tooltip from '../../common/tooltip/Tooltip';
import {
    getPrimarySocietyImage,
    getSocietyHeroLayoutId,
    getSocietyTitleLayoutId,
    SOCIETY_SHARED_TRANSITION,
} from "../utils/societyMotion";

/** Displays a verified icon for officially ratified societies. */

function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return <BadgeCheck className={styles.verifiedIcon} size={22} title="Official Society" aria-label="Official Society" />;
}

/** Interactive card component for society directory listings. */

export default function SocietyCard({ society, onClick, onReport, onUnreport }) {
    const reduceMotion = useReducedMotion();
    const imageUrl = getPrimarySocietyImage(society);
    const bg = imageUrl ? { backgroundImage: `linear-gradient(color-mix(in srgb, black 20%, transparent), color-mix(in srgb, black 60%, transparent)), url(${imageUrl})` } : {};
    const heroLayoutId = reduceMotion ? undefined : getSocietyHeroLayoutId(society.id);
    const titleLayoutId = reduceMotion ? undefined : getSocietyTitleLayoutId(society.id);

    return (
        <GridCard className={styles.card} onClick={() => onClick?.(society.id)}>
            <motion.div
                className={styles.cardMedia}
                style={bg}
                layoutId={heroLayoutId}
                transition={SOCIETY_SHARED_TRANSITION}
            />
            <ReportAction society={society} onReport={onReport} onUnreport={onUnreport} />
            <SocietyCardContent
                society={society}
                hasImage={!!imageUrl}
                RatifiedBadge={RatifiedBadge}
                titleLayoutId={titleLayoutId}
            />
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

    const tooltipText = reported ? "You have reported this society. Click to unreport." : "Report society";
    return (
        <Tooltip content={tooltipText} position="top" wrapperClassName={styles.reportTooltipWrap}>
            <button
                type="button"
                className={`${styles.reportBtn} ${reported ? styles.reported : ''}`}
                onClick={handleClick}
                aria-label={tooltipText}
            >
                <Flag size={16} fill={reported ? "currentColor" : "none"} strokeWidth={reported ? 1 : 2} />
            </button>
        </Tooltip>
    );
}
