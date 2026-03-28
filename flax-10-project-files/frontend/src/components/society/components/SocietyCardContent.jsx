/*
 * SocietyCardContent renders the informational content inside a society card.
 */

import { motion } from "framer-motion";
import styles from '../styles/SocietyCard.module.css';
import EntityLinkChip from '../../common/entity_link_chip/EntityLinkChip';
import { SOCIETY_SHARED_TRANSITION } from "../utils/societyMotion";

export function SocietyCardContent({ society, hasImage, RatifiedBadge, titleLayoutId }) {
    const content = <CardInfo society={society} RatifiedBadge={RatifiedBadge} titleLayoutId={titleLayoutId} />;
    return hasImage ? content : <div className={styles.overlay}>{content}</div>;
}

function CardInfo({ society, RatifiedBadge, titleLayoutId }) {
    const relatedCounts = getRelatedCounts(society);
    return (
        <div className={styles.info}>
            <CardTitle society={society} RatifiedBadge={RatifiedBadge} titleLayoutId={titleLayoutId} />
            <p className={styles.count}>{society.member_count} members</p>
            <RelatedLinks society={society} relatedCounts={relatedCounts} />
        </div>
    );
}

function CardTitle({ society, RatifiedBadge, titleLayoutId }) {
    return (
        <h3 className={styles.name}>
            <EntityLinkChip to={`/societies?id=${society.id}`} className={styles.nameChip}>
                <motion.span className={styles.nameLabel} layoutId={titleLayoutId} transition={SOCIETY_SHARED_TRANSITION}>
                    {society.name}
                </motion.span>
            </EntityLinkChip>
            {RatifiedBadge && <RatifiedBadge isRatified={society.is_ratified} />}
        </h3>
    );
}

function RelatedLinks({ society, relatedCounts }) {
    if (!relatedCounts.showEvents && !relatedCounts.showTasks) return null;
    return (
        <div className={styles.relatedRow}>
            {relatedCounts.showEvents && <EventsChip society={society} count={relatedCounts.eventsCount} />}
            {relatedCounts.showTasks && <TasksChip society={society} count={relatedCounts.tasksCount} />}
        </div>
    );
}

function EventsChip({ society, count }) {
    return (
        <EntityLinkChip to={`/societies?id=${society.id}&tab=events`} className={styles.relatedChip}>
            📅 {count} event{count === 1 ? '' : 's'}
        </EntityLinkChip>
    );
}

function TasksChip({ society, count }) {
    return (
        <EntityLinkChip to={`/tasks?society=${encodeURIComponent(society.name || '')}`} className={styles.relatedChip}>
            ✅ {count} task{count === 1 ? '' : 's'}
        </EntityLinkChip>
    );
}

function getRelatedCounts(society) {
    const eventsCount = getEventsCount(society);
    const tasksCount = society.related_tasks_count ?? society.tasks_count ?? null;
    return {
        eventsCount,
        tasksCount,
        showEvents: isPositiveCount(eventsCount),
        showTasks: isPositiveCount(tasksCount),
    };
}

function getEventsCount(society) {
    if (society.upcoming_events_count != null) return society.upcoming_events_count;
    if (society.events_count != null) return society.events_count;
    return Array.isArray(society.events) ? society.events.length : null;
}

function isPositiveCount(value) {
    return Number.isFinite(Number(value)) && Number(value) > 0;
}
