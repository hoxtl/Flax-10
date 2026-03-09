import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { useEventModal } from '../../../context/CalendarContext';
import { useQuickActions } from '../hooks/useQuickActions';
import styles from './ListView.module.css';

function formatEventTime(event) {
    const start = new Date(event.start_time);
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    return start.toLocaleTimeString('en-US', opts);
}

function getTagBadges(event) {
    const badges = [];
    const tagName = event.tag_name || event.tag?.name;
    if (tagName) badges.push({ label: tagName, type: 'tag' });

    const eventType = getEventType(event);
    if (eventType === 'module' && event.module?.name) {
        badges.push({ label: event.module.name, type: 'source' });
    }
    if (eventType === 'society' && event.society_name) {
        badges.push({ label: event.society_name, type: 'source' });
    }
    return badges;
}

function TagBadge({ badge }) {
    const className = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    return <span className={className}>{badge.label}</span>;
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
    const isReadOnly = isReadOnlyEvent(event);
    const quickAction = useQuickActions(event);

    const handleEdit = (e) => { e.stopPropagation(); openModal(event); };

    return (
        <div className={`${styles.eventRow} ${isReadOnly ? styles.readOnly : ''}`} onClick={() => setIsExpanded(e => !e)}>
            <div className={styles.rowMain}>
                <span className={styles.eventTime}>{formatEventTime(event)}</span>
                <span className={styles.eventTitle}>{event.title}</span>
                <div className={styles.badgesContainer}>
                    {getTagBadges(event).map((b, i) => <TagBadge key={i} badge={b} />)}
                </div>
                {!isReadOnly && <EditButton onClick={handleEdit} />}
                {isReadOnly && quickAction && (
                    <button className={styles.quickActionBtn} onClick={quickAction.onClick}>{quickAction.label}</button>
                )}
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
