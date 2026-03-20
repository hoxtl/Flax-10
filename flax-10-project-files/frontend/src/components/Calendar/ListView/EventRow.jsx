import { useRef } from 'react';
import { getEventType, isReadOnlyEvent, isAllDay } from '../utils/eventUtils';
import { useEventPopup } from '../../../context/CalendarContext';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import Badge from '../../common/Badge/Badge';
import styles from './ListView.module.css';

export function formatEventTime(event) {
    if (isAllDay(event)) return 'All day';
    const start = new Date(event.start_time);
    return start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

export function getTagBadges(event, accentColor) {
    const tagName = event.tag_name || event.tag?.name;
    const badges = tagName ? [{ label: tagName, type: 'tag', color: accentColor }] : [];
    const eventType = getEventType(event);
    if (eventType === 'module' && event.module?.name) {
        badges.push({ label: event.module.name, type: 'source', color: null });
    }
    if (eventType === 'society' && event.society_name) {
        const societyColor = event.society_color || accentColor;
        badges.push({ label: event.society_name, type: 'source', color: societyColor });
    }
    return badges;
}

export function TagBadge({ badge }) {
    const className = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    const style = badge.type === 'source' && badge.color
        ? { backgroundColor: badge.color, color: '#FAF9F6' }
        : undefined;
    return <Badge className={className} tone={badge.type === 'source' ? "default" : "muted"} style={style}>{badge.label}</Badge>;
}

/**
 * Single cell used inside a ConflictRow — name + badges only, no time column.
 */
function ConflictEventCell({ event }) {
    const ref = useRef(null);
    const { openPopup } = useEventPopup();
    const tagContext = useTags();
    const accentColor = getEventTheme(event, tagContext).color;
    const badges = getTagBadges(event, accentColor);
    const readOnly = isReadOnlyEvent(event);

    const onClick = () => {
        const rect = ref.current?.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div
            ref={ref}
            className={`${styles.conflictCell} ${readOnly ? styles.readOnly : ''}`}
            onClick={onClick}
            style={accentColor ? { '--accent': accentColor } : undefined}
        >
            <div className={styles.eventMain}>
                <div className={styles.eventTime}>{formatEventTime(event)}</div>
                <div className={styles.eventContent}>
                    <div className={styles.eventName}>{event.title}</div>
                    {badges.length > 0 && (
                        <div className={styles.badgesContainer}>
                            {badges.map((badge, i) => <TagBadge key={i} badge={badge} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Renders 2+ overlapping events stacked vertically.
 */
export function ConflictRow({ events }) {
    return (
        <div className={styles.conflictRow}>
            {events.map(event => (
                <ConflictEventCell key={event.id} event={event} />
            ))}
        </div>
    );
}

/**
 * Renders a single row in the calendar list view.
 * Clicking opens the shared EventPopover (same as grid view).
 */
export function EventRow({ event }) {
    const ref = useRef(null);
    const { openPopup } = useEventPopup();
    const tagContext = useTags();
    const accentColor = getEventTheme(event, tagContext).color;
    const badges = getTagBadges(event, accentColor);
    const readOnly = isReadOnlyEvent(event);

    const onClick = () => {
        const rect = ref.current?.getBoundingClientRect();
        openPopup(event, rect);
    };

    return (
        <div
            ref={ref}
            className={`${styles.eventRow} ${readOnly ? styles.readOnly : ''}`}
            onClick={onClick}
            style={accentColor ? { '--accent': accentColor } : undefined}
        >
            <div className={styles.eventMain}>
                <div className={styles.eventTime}>{formatEventTime(event)}</div>
                <div className={styles.eventContent}>
                    <div className={styles.eventName}>{event.title}</div>
                    {badges.length > 0 && (
                        <div className={styles.badgesContainer}>
                            {badges.map((badge, index) => <TagBadge key={index} badge={badge} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
