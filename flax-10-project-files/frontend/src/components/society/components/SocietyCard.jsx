/*
 * SocietyCard composes the interactive shell for a society browse card.
 */

import styles from "../styles/SocietyCard.module.css";
import GridCard from "../../common/card/GridCard";
import { Flag, BadgeCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SocietyCardContent } from "./SocietyCardContent";
import Tooltip from "../../common/tooltip/Tooltip";
import {
    getPrimarySocietyImage,
    getSocietyHeroLayoutId,
    getSocietyTitleLayoutId,
    SOCIETY_SHARED_TRANSITION,
} from "../utils/societyMotion";

function getCardBackground(imageUrl) {
    return imageUrl ? { backgroundImage: `linear-gradient(color-mix(in srgb, black 20%, transparent), color-mix(in srgb, black 60%, transparent)), url(${imageUrl})` } : {};
}

function useSocietyCardMotion(society) {
    const reduceMotion = useReducedMotion();
    const imageUrl = getPrimarySocietyImage(society);
    return {
        imageUrl,
        background: getCardBackground(imageUrl),
        heroLayoutId: reduceMotion ? undefined : getSocietyHeroLayoutId(society.id),
        titleLayoutId: reduceMotion ? undefined : getSocietyTitleLayoutId(society.id),
    };
}

/** Displays a verified icon for officially ratified societies. */
function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return <BadgeCheck className={styles.verifiedIcon} size={22} title="Official Society" aria-label="Official Society" />;
}

/** Interactive card component for society directory listings. */
export default function SocietyCard(props) {
    const card = useSocietyCardMotion(props.society);
    return <SocietyCardShell {...props} card={card} />;
}

function SocietyCardShell({ society, onClick, onReport, onUnreport, card }) {
    return (
        <GridCard className={styles.card} onClick={() => onClick?.(society.id)}>
            <motion.div className={styles.cardMedia} style={card.background} layoutId={card.heroLayoutId} transition={SOCIETY_SHARED_TRANSITION} />
            <ReportAction society={society} onReport={onReport} onUnreport={onUnreport} />
            <SocietyCardContent society={society} hasImage={Boolean(card.imageUrl)} RatifiedBadge={RatifiedBadge} titleLayoutId={card.titleLayoutId} />
        </GridCard>
    );
}

function getReportTooltip(reported) {
    return reported ? "You have reported this society. Click to unreport." : "Report society";
}

function handleReportAction(event, reported, society, onReport, onUnreport) {
    event.stopPropagation();
    return reported ? onUnreport?.(society) : onReport?.(society);
}

/** Handles the report/unreport button logic and state. */
function ReportAction({ society, onReport, onUnreport }) {
    const reported = society.has_reported;
    const tooltipText = getReportTooltip(reported);
    return (
        <Tooltip content={tooltipText} position="top" wrapperClassName={styles.reportTooltipWrap}>
            <button type="button" className={`${styles.reportBtn} ${reported ? styles.reported : ""}`} onClick={(event) => handleReportAction(event, reported, society, onReport, onUnreport)} aria-label={tooltipText}>
                <Flag size={16} fill={reported ? "currentColor" : "none"} strokeWidth={reported ? 1 : 2} />
            </button>
        </Tooltip>
    );
}
