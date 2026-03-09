import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { EditableCell } from './cells/EditableCell';
import { useQuickActions } from '../hooks/useQuickActions';
import styles from './TableView.module.css';

function formatDateTime(event) {
    const start = new Date(event.start_time);
    const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return start.toLocaleString('en-US', opts);
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
    const cls = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    return <span className={cls}>{badge.label}</span>;
}

function TagCell({ event }) {
    const badges = getTagBadges(event);
    return (
        <td className={styles.tagCell}>
            {badges.map((b, i) => <TagBadge key={i} badge={b} />)}
        </td>
    );
}

export function TableRow({ event, rowIndex, editState, onCellClick, onKeyDown }) {
    const isReadOnly = isReadOnlyEvent(event);
    const { editingCell, cellValue, updateValue } = editState;
    const quickAction = useQuickActions(event);

    const isEditing = (field) => {
        return editingCell?.eventId === event.id && editingCell?.field === field;
    };

    const handleCellClick = (field) => {
        if (isReadOnly) return;
        onCellClick(event.id, field, event[field]);
    };

    const handleKeyDown = (e, colIndex) => onKeyDown(e, rowIndex, colIndex);

    return (
        <tr className={`${styles.row} ${isReadOnly ? styles.readOnly : ''}`}>
            <td className={styles.nameCell} onClick={() => handleCellClick('title')}>
                <div className={styles.nameCellContent}>
                    <EditableCell
                        value={isEditing('title') ? cellValue : event.title}
                        isEditing={isEditing('title')}
                        onChange={updateValue}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                    />
                    {isReadOnly && quickAction && (
                        <button className={styles.quickActionBtn} onClick={quickAction.onClick}>{quickAction.label}</button>
                    )}
                </div>
            </td>
            <TagCell event={event} />
            <td className={styles.dateCell}>{formatDateTime(event)}</td>
            <td className={styles.locationCell} onClick={() => handleCellClick('location')}>
                <EditableCell
                    value={isEditing('location') ? cellValue : event.location}
                    isEditing={isEditing('location')}
                    onChange={updateValue}
                    onKeyDown={(e) => handleKeyDown(e, 1)}
                />
            </td>
            <td className={styles.descCell} onClick={() => handleCellClick('description')}>
                <EditableCell
                    value={isEditing('description') ? cellValue : event.description}
                    isEditing={isEditing('description')}
                    onChange={updateValue}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    isTextarea
                />
            </td>
        </tr>
    );
}
