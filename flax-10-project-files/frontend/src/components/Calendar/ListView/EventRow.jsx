import { useState } from 'react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { useEventModal } from '../../../context/CalendarContext';
import { useQuickActions } from '../hooks/useQuickActions';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import Badge from '../../common/Badge/Badge';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import styles from './ListView.module.css';
import { isAllDay } from '../utils/eventUtils';

function formatEventTime(event) {
    if (isAllDay(event)) return 'All day';
    const start = new Date(event.start_time);
    return start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatTimeRange(event) {
    if (isAllDay(event)) return 'All day';
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    const from = start.toLocaleTimeString('en-US', opts);
    const to = end.toLocaleTimeString('en-US', opts);
    return `${from} - ${to}`;
}

function getDurationLabel(event) {
    if (isAllDay(event)) return 'All day';
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const minutes = Math.max(0, Math.round((end - start) / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

function getTagBadges(event, accentColor) {
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

function TagBadge({ badge }) {
    const className = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    const style = badge.color ? { backgroundColor: badge.color, color: 'var(--c-white)', borderColor: badge.color } : undefined;
    return <Badge className={className} tone={badge.type === 'source' ? "default" : "muted"} style={style}>{badge.label}</Badge>;
}

function DetailRow({ label, value, muted, full }) {
    const valueClass = muted ? styles.detailValueMuted : styles.detailValue;
    const rowClass = full ? `${styles.detailItem} ${styles.detailFullRow}` : styles.detailItem;
    return (
        <div className={rowClass}>
            <div className={styles.detailLabel}>{label}</div>
            <div className={valueClass}>{value}</div>
        </div>
    );
}

function DetailButton({ variant = 'secondary', onClick, children }) {
    return (
        <PrimaryButton type="button" className={styles.detailButton} onClick={onClick} variant={variant === 'primary' ? 'primary' : 'ghost'} size="small" pill>
            {children}
        </PrimaryButton>
    );
}

/**
 * Renders a single row in the calendar list view with expandable details.
 */
export function EventRow({ event }) {
    const [expanded, setExpanded] = useState(false);
    const { openModal } = useEventModal();
    const tagContext = useTags();
    const quickAction = useQuickActions(event);
    const accentColor = getEventTheme(event, tagContext).color;
    const badges = getTagBadges(event, accentColor);
    const readOnly = isReadOnlyEvent(event);
    const onToggle = () => setExpanded(prev => !prev);
    const onEdit = (e) => { e.stopPropagation(); openModal(event); };
    const onUnimap = (e) => {
        e.stopPropagation();
        window.open('/map', '_blank', 'noopener,noreferrer');
    };
    const onQuick = (e) => {
        e.stopPropagation();
        quickAction?.onClick();
    };
    return (
        <div
            className={`${styles.eventRow} ${expanded ? styles.expanded : ''} ${readOnly ? styles.readOnly : ''}`}
            onClick={onToggle}
        >
            <EventRowMain
                event={event}
                themeColor={accentColor}
                badges={badges}
                expanded={expanded}
            />
            {expanded && (
                <EventRowDetail
                    event={event}
                    readOnly={readOnly}
                    hasQuick={!!quickAction}
                    onEdit={onEdit}
                    onUnimap={onUnimap}
                    onQuick={onQuick}
                    quickLabel={quickAction?.label}
                />
            )}
        </div>
    );
}

function EventRowMain({ event, themeColor, badges, expanded }) {
    return (
        <div className={styles.eventMain}>
            <div className={styles.eventStrip} style={{ backgroundColor: themeColor }} />
            <div className={styles.eventTime}>{formatEventTime(event)}</div>
            <div className={styles.eventName}>{event.title}</div>
            <div className={styles.badgesContainer}>
                {badges.map((badge, index) => <TagBadge key={index} badge={badge} />)}
            </div>
            <div className={styles.eventChevron}>{expanded ? '▲' : '▼'}</div>
        </div>
    );
}

function EventRowDetail({
    event,
    readOnly,
    hasQuick,
    onEdit,
    onUnimap,
    onQuick,
    quickLabel
}) {
    const typeLabel = event.tag_name || event.tag?.name || getEventType(event);
    const timeLabel = `${formatTimeRange(event)} · ${getDurationLabel(event)}`;
    const location = event.location || '-';
    const description = event.description || '-';
    return (
        <div className={styles.eventDetail}>
            <div className={styles.detailGrid}>
                <DetailRow label="Time" value={timeLabel} />
                <DetailRow label="Type" value={typeLabel} />
                <DetailRow label="Location" value={location} muted={!event.location} full />
                <DetailRow label="Description" value={description} muted={!event.description} full />
            </div>
            <div className={styles.detailActions}>
                {!readOnly && <DetailButton variant="primary" onClick={onEdit}>Edit</DetailButton>}
                <DetailButton onClick={onUnimap}>Get directions</DetailButton>
                {readOnly && hasQuick && (
                    <DetailButton onClick={onQuick}>{quickLabel}</DetailButton>
                )}
            </div>
        </div>
    );
}
