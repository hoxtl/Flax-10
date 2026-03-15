/**
 * SocietyCard renders a visual summary of a society, including its cover image,
 * name, membership count, and a quick-report action.
 */
import styles from './SocietyCard.module.css';
import GridCard from '../common/Card/GridCard';
import EntityLinkChip from '../common/EntityLinkChip/EntityLinkChip';
import { Flag, BadgeCheck } from "lucide-react";

/** Displays a verified icon for officially ratified societies. */
function RatifiedBadge({ isRatified }) {
    if (!isRatified) return null;
    return <BadgeCheck className={styles.verifiedIcon} size={22} title="Official Society" aria-label="Official Society" />;
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
    const eventsCount = society.upcoming_events_count ?? society.events_count ?? (Array.isArray(society.events) ? society.events.length : null);
    const tasksCount = society.related_tasks_count ?? society.tasks_count ?? null;
    const showEvents = Number.isFinite(Number(eventsCount)) && Number(eventsCount) > 0;
    const showTasks = Number.isFinite(Number(tasksCount)) && Number(tasksCount) > 0;
    const info = (
        <div className={styles.info}>
            <h3 className={styles.name}>
                <EntityLinkChip to={`/societies?id=${society.id}`} className={styles.nameChip}>
                    {society.name}
                </EntityLinkChip>
                <RatifiedBadge isRatified={society.is_ratified} />
            </h3>
            <p className={styles.count}>{society.member_count} members</p>
            {(showEvents || showTasks) && (
                <div className={styles.relatedRow}>
                {showEvents && (
                    <EntityLinkChip to={`/societies?id=${society.id}&tab=events`} className={styles.relatedChip}>
                        📅 {eventsCount} event{eventsCount === 1 ? '' : 's'}
                    </EntityLinkChip>
                )}
                {showTasks && (
                    <EntityLinkChip to={`/tasks?society=${encodeURIComponent(society.name || '')}`} className={styles.relatedChip}>
                        ✅ {tasksCount} task{tasksCount === 1 ? '' : 's'}
                    </EntityLinkChip>
                )}
                </div>
            )}
        </div>
    );
    return hasImage ? info : <div className={styles.overlay}>{info}</div>;
}
