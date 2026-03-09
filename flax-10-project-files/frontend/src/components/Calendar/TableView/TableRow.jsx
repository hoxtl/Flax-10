import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { EditableCell } from './cells/EditableCell';
import { useQuickActions } from '../hooks/useQuickActions';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import styles from './TableView.module.css';

function formatDateTime(event) {
    const start = new Date(event.start_time);
    const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return start.toLocaleString('en-US', opts);
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
    const cls = badge.type === 'source' ? styles.sourceBadge : styles.tagBadge;
    const style = badge.color ? { backgroundColor: badge.color, color: '#fff' } : {};
    return <span className={cls} style={style}>{badge.label}</span>;
}

function TagCell({ event, tags }) {
    const badges = getTagBadges(event, tags);
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
    const { tags } = useTags();

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
            <TagCell event={event} tags={tags} />
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
