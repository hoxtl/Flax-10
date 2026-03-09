import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { useEventModal } from '../../../context/CalendarContext';
import { useQuickActions } from '../hooks/useQuickActions';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import styles from './ListView.module.css';

function formatEventTime(event) {
    const start = new Date(event.start_time);
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    return start.toLocaleTimeString('en-US', opts);
}

function getTagBadges(event, tags) {
    const badges = [];
    const tagName = event.tag_name || event.tag?.name;
    const theme = getEventTheme(event, tags);
    if (tagName) badges.push({ label: tagName, type: 'tag', color: theme.color });

    const eventType = getEventType(event);
    if (eventType === 'module' && event.module?.name) {
        badges.push({ label: event.module.name, type: 'source', color: null });
    }
    if (eventType === 'society' && event.society_name) {
        const societyColor = event.society_color || theme.color;
        badges.push({ label: event.society_name, type: 'source', color: societyColor });
    }
    return badges;
}

function TagBadge({ badge }) {
    const baseClass = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    const style = badge.color ? { backgroundColor: badge.color, color: '#fff' } : {};
    return <span className={baseClass} style={style}>{badge.label}</span>;
}

function EditButton({ onClick }) {
    return (
        <button className={styles.editBtn} onClick={onClick} aria-label="Edit event">
            <Pencil size={14} />
        </button>
    );
}

export function EventRow({ event }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { openModal } = useEventModal();
    const { tags } = useTags();
    const isReadOnly = isReadOnlyEvent(event);
    const quickAction = useQuickActions(event);
    const badges = getTagBadges(event, tags);

    const handleEdit = (e) => { e.stopPropagation(); openModal(event); };

    return (
        <div className={`${styles.eventRow} ${isReadOnly ? styles.readOnly : ''}`} onClick={() => setIsExpanded(e => !e)}>
            <div className={styles.rowMain}>
                <span className={styles.eventTime}>{formatEventTime(event)}</span>
                <span className={styles.eventTitle}>{event.title}</span>
                <div className={styles.rowActions}>
                    {!isReadOnly && <EditButton onClick={handleEdit} />}
                    {isReadOnly && quickAction && (
                        <button className={styles.quickActionBtn} onClick={quickAction.onClick}>{quickAction.label}</button>
                    )}
                </div>
                <div className={styles.badgesContainer}>
                    {badges.map((b, i) => <TagBadge key={i} badge={b} />)}
                </div>
            </div>
            {isExpanded && (event.location || event.description) && (
                <div className={styles.expandedContent}>
                    {event.location && <div>📍 {event.location}</div>}
                    {event.description && <div style={{ whiteSpace: 'pre-wrap' }}>📝 {event.description}</div>}
                </div>
            )}
        </div>
    );
}
