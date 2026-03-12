import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { EditableCell } from './cells/EditableCell';
import { TagEditCell } from './cells/TagEditCell';
import { DateTimeCell } from './cells/DateTimeCell';
import { useQuickActions } from '../hooks/useQuickActions';
import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import { isSameDay } from '../utils/dateUtils';
import styles from './TableView.module.css';

function getSourceBadge(event) {
    const eventType = getEventType(event);
    if (eventType === 'module' && event.module?.name) return { label: event.module.name };
    if (eventType === 'society' && event.society_name) return { label: event.society_name, color: event.society_color };
    return null;
}

function SourceBadge({ badge }) {
    if (!badge) return null;
    const style = badge.color ? { backgroundColor: badge.color } : {};
    return <span className={styles.sourceBadge} style={style}>{badge.label}</span>;
}

function EditIcon({ show }) {
    if (!show) return null;
    return <Pencil size={14} className={styles.editIcon} />;
}

export function TableRow({ event, events, rowIndex, editState, navState, onCellClick, viewMode }) {
    const isReadOnly = isReadOnlyEvent(event);
    const [isExpanded, setIsExpanded] = useState(false);
    const { editingCell, cellValue, updateValue } = editState;
    const { focusedCell, handleKeyDown, EDITABLE_COLUMNS } = navState;
    const quickAction = useQuickActions(event);
    const tagContext = useTags();
    const theme = getEventTheme(event, tagContext);

    const isEditing = (field) => editingCell?.eventId === event.id && editingCell?.field === field;
    const isEditingDesc = isEditing('description');

    const handleCellClick = (e, field, colIndex) => {
        if (isReadOnly) return; // Let it bubble to row for expansion
        e.stopPropagation();
        const value = field === 'tag' ? (event.tag || event.tag_id) : event[field];
        onCellClick(event.id, field, value);
    };

    const handleRowClick = () => {
        if (isReadOnly) setIsExpanded(prev => !prev);
    };

    const stopPropIfEditable = (e) => {
        if (!isReadOnly) e.stopPropagation();
    };

    const onKeyDown = (e, colIndex) => handleKeyDown(e, rowIndex, colIndex);

    useEffect(() => {
        if (!focusedCell || focusedCell.row !== rowIndex || isReadOnly) return;
        const field = EDITABLE_COLUMNS[focusedCell.col];
        if (field && !isEditing(field)) {
            const value = field === 'tag' ? (event.tag || event.tag_id) : event[field];
            onCellClick(event.id, field, value);
        }
    }, [focusedCell, rowIndex, isReadOnly, EDITABLE_COLUMNS, event, onCellClick]);

    const sourceBadge = getSourceBadge(event);
    const isTodayRow = viewMode !== 'day' && isSameDay(new Date(event.start_time), new Date());
    const todayClass = isTodayRow ? styles.todayRow : '';
    const rowClass = `${styles.row} ${isReadOnly ? styles.readOnly : ''} ${isExpanded ? styles.expanded : ''} ${todayClass}`;
    const descClass = `${styles.descCell} ${isEditingDesc || isExpanded ? styles.descExpanded : ''}`;

    return (
        <tr className={rowClass} onClick={handleRowClick}>
            <td className={styles.nameCell} onClick={(e) => handleCellClick(e, 'title', 0)}>
                <div className={styles.nameCellContent}>
                    <EditableCell value={isEditing('title') ? cellValue : event.title}
                        isEditing={isEditing('title')} onChange={updateValue} onKeyDown={(e) => onKeyDown(e, 0)} />
                    <EditIcon show={!isReadOnly && !isEditing('title')} />
                    {isReadOnly && quickAction && (
                        <button className={styles.quickActionBtn} onClick={(e) => { e.stopPropagation(); quickAction.onClick(); }}>{quickAction.label}</button>
                    )}
                </div>
            </td>
            <td className={styles.tagCell} onClick={stopPropIfEditable}>
                <TagEditCell event={event} tags={tagContext.tags} theme={theme} isReadOnly={isReadOnly}
                    isEditing={isEditing('tag')} editValue={cellValue} onEdit={(e) => handleCellClick(e, 'tag', 1)}
                    onSave={editState.saveWithValue} onCancel={editState.cancelEdit} />
                <SourceBadge badge={sourceBadge} />
            </td>
            <td className={styles.dateCell} onClick={stopPropIfEditable}>
                <DateTimeCell event={event} isReadOnly={isReadOnly} onSave={(times) => editState.saveDateTimes(event.id, times)} />
            </td>
            <td className={styles.locationCell} onClick={(e) => handleCellClick(e, 'location', 2)}>
                <div className={styles.cellWrapper}>
                    <EditableCell value={isEditing('location') ? cellValue : event.location}
                        isEditing={isEditing('location')} onChange={updateValue} onKeyDown={(e) => onKeyDown(e, 2)} />
                    <EditIcon show={!isReadOnly && !isEditing('location')} />
                </div>
            </td>
            <td className={descClass} onClick={(e) => handleCellClick(e, 'description', 3)}>
                <div className={styles.cellWrapper}>
                    <EditableCell value={isEditingDesc ? cellValue : event.description}
                        isEditing={isEditingDesc} onChange={updateValue} onKeyDown={(e) => onKeyDown(e, 3)} isTextarea />
                    <EditIcon show={!isReadOnly && !isEditingDesc} />
                </div>
            </td>
        </tr>
    );
}
