/*
 * Calendar list view event row components.
 */

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
    return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getTagBadges(event, accentColor) {
    const tagName = event.tag_name || event.tag?.name;
    const badges = tagName ? [{ label: tagName, type: 'tag', color: accentColor }] : [];
    const eventType = getEventType(event);
    if (eventType === 'module' && event.module?.name) badges.push({ label: event.module.name, type: 'source' });
    if (eventType === 'society' && event.society_name) {
        badges.push({ label: event.society_name, type: 'source', color: event.society_color || accentColor });
    }
    return badges;
}

export function TagBadge({ badge }) {
    const className = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    const style = badge.color ? { backgroundColor: badge.color, color: 'var(--c-white)', borderColor: badge.color } : undefined;
    return <Badge className={className} tone={badge.type === 'source' ? "default" : "muted"} style={style}>{badge.label}</Badge>;
}

function EventRowMain({ event, accentColor, badges }) {
    return (
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
    );
}

function useEventRowData(event) {
    const tagContext = useTags();
    const accentColor = getEventTheme(event, tagContext).color;
    return { accentColor, badges: getTagBadges(event, accentColor), readOnly: isReadOnlyEvent(event) };
}

function ConflictEventCell({ event }) {
    const ref = useRef(null);
    const { openPopup } = useEventPopup();
    const { accentColor, badges, readOnly } = useEventRowData(event);
    const onClick = () => openPopup(event, ref.current?.getBoundingClientRect());
    return (
        <div ref={ref} className={`${styles.conflictCell} ${readOnly ? styles.readOnly : ''}`} data-event-id={event.id} onClick={onClick} style={accentColor ? { '--accent': accentColor } : undefined}>
            <EventRowMain event={event} accentColor={accentColor} badges={badges} />
        </div>
    );
}

export function ConflictRow({ events }) {
    return (
        <div className={styles.conflictRow}>
            {events.map(event => <ConflictEventCell key={event.id} event={event} />)}
        </div>
    );
}

export function EventRow({ event }) {
    const ref = useRef(null);
    const { openPopup } = useEventPopup();
    const { accentColor, badges, readOnly } = useEventRowData(event);
    const onClick = () => openPopup(event, ref.current?.getBoundingClientRect());
    return (
        <div ref={ref} className={`${styles.eventRow} ${readOnly ? styles.readOnly : ''}`} data-event-id={event.id} onClick={onClick} style={accentColor ? { '--accent': accentColor } : undefined}>
            <EventRowMain event={event} accentColor={accentColor} badges={badges} />
        </div>
    );
}
