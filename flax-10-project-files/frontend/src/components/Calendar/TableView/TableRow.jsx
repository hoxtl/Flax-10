import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { EditableCell } from './cells/EditableCell';
import { TagEditCell } from './cells/TagEditCell';
import { DateTimeCell } from './cells/DateTimeCell';

import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import { isSameDay } from '../utils/dateUtils';
import { useEventActions } from '../hooks/useCalendarEvents';
import ConfirmModal from '../../common/ConfirmModal/ConfirmModal';
import styles from './TableView.module.css';

function getSourceBadge(event) {
    const type = getEventType(event);
    if (type === 'module' && event.module?.name) return { label: event.module.name };
    if (type === 'society' && event.society_name) return { label: event.society_name, color: event.society_color };
    return null;
}

const SourceBadge = ({ badge }) => badge && (
    <span className={styles.sourceBadge} style={badge.color ? { backgroundColor: badge.color } : {}}>
        {badge.label}
    </span>
);

const EditIcon = ({ show }) => show ? <Pencil size={14} className={styles.editIcon} /> : null;

function DeleteConfirmModal({ onConfirm, onCancel }) {
    return (
        <ConfirmModal
            title="Delete Event"
            message="Are you sure you want to delete this event? This action cannot be undone."
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="Delete"
            isDanger
        />
    );
}

function ActionCell({ eventId, isReadOnly }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const { removeEvent } = useEventActions();
    if (isReadOnly) return <td className={styles.actionCell} />;
    return (
        <td className={styles.actionCell} onClick={e => e.stopPropagation()}>
            <button className={styles.trashBtn} onClick={() => setShowConfirm(true)}>
                <Trash2 size={16} />
            </button>
            {showConfirm && (
                <DeleteConfirmModal
                    onConfirm={() => removeEvent(eventId)}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </td>
    );
}

function NameCell({ event, isEditing, cellValue, updateValue, onKeyDown, onEdit, isReadOnly, quickAction }) {
    return (
        <td className={styles.nameCell} onClick={onEdit}>
            <div className={styles.nameCellContent}>
                <EditableCell value={isEditing ? cellValue : event.title}
                    isEditing={isEditing} onChange={updateValue} onKeyDown={onKeyDown} />
                <EditIcon show={!isReadOnly && !isEditing} />
                {isReadOnly && quickAction && (
                    <button className={styles.quickActionBtn} onClick={quickAction.onClick}>{quickAction.label}</button>
                )}
            </div>
        </td>
    );
}

function TagCell({ event, tags, theme, isReadOnly, isEditing, cellValue, onEdit, onSave, onCancel, badge }) {
    return (
        <td className={styles.tagCell} onClick={e => !isReadOnly && e.stopPropagation()}>
            <TagEditCell
                event={event} tags={tags} theme={theme} isReadOnly={isReadOnly}
                isEditing={isEditing} editValue={cellValue} onEdit={onEdit}
                onSave={onSave} onCancel={onCancel}
            />
            <SourceBadge badge={badge} />
        </td>
    );
}

function EditableFieldCell({ value, isEditing, onChange, onKeyDown, onEdit, showEditIcon, isTextarea, className }) {
    return (
        <td className={className} onClick={onEdit}>
            <div className={styles.cellWrapper}>
                <EditableCell value={value} isEditing={isEditing} onChange={onChange}
                    onKeyDown={onKeyDown} isTextarea={isTextarea} />
                <EditIcon show={showEditIcon} />
            </div>
        </td>
    );
}

function useTableRowState(event, rowIndex, editState, navState, onCellClick, viewMode) {
    const isReadOnly = isReadOnlyEvent(event);
    const [isExpanded, setIsExpanded] = useState(false);
    const isEditing = (field) => editState.editingCell?.eventId === event.id && editState.editingCell?.field === field;
    const onEdit = (e, field) => {
        if (isReadOnly) return;
        if (e) e.stopPropagation();
        onCellClick(event.id, field, field === 'tag' ? (event.tag || event.tag_id) : event[field]);
    };
    useEffect(() => {
        const field = navState.EDITABLE_COLUMNS[navState.focusedCell?.col];
        if (navState.focusedCell?.row === rowIndex && !isReadOnly && field && !isEditing(field)) onEdit(null, field);
    }, [navState.focusedCell, rowIndex, isReadOnly, navState.EDITABLE_COLUMNS, event]);

    const isToday = viewMode !== 'day' && isSameDay(new Date(event.start_time), new Date());
    const rowClass = `${styles.row} ${isReadOnly ? styles.readOnly : ''} ${isExpanded ? styles.expanded : ''} ${isToday ? styles.todayRow : ''}`;

    return { isReadOnly, isExpanded, setIsExpanded, isEditing, onEdit, rowClass };
}

export function TableRow({ event, rowIndex, editState, navState, onCellClick, viewMode }) {
    const state = useTableRowState(event, rowIndex, editState, navState, onCellClick, viewMode);
    const { tags } = useTags();
    const theme = getEventTheme(event, { tags });
    const accentColor = theme.color;

    return (
        <tr className={state.rowClass} style={accentColor ? { '--accent': accentColor } : undefined} onClick={() => state.isReadOnly && state.setIsExpanded(p => !p)}>
            <NameCell event={event} isEditing={state.isEditing('title')} cellValue={editState.cellValue} updateValue={editState.updateValue}
                onKeyDown={e => navState.handleKeyDown(e, rowIndex, 0)} onEdit={e => state.onEdit(e, 'title')} isReadOnly={state.isReadOnly} quickAction={null} />
            <TagCell event={event} tags={tags} theme={theme} isReadOnly={state.isReadOnly} isEditing={state.isEditing('tag')}
                cellValue={editState.cellValue} onEdit={e => state.onEdit(e, 'tag')} onSave={editState.saveWithValue} onCancel={editState.cancelEdit} badge={getSourceBadge(event)} />
            <td className={styles.dateCell} onClick={e => !state.isReadOnly && e.stopPropagation()}>
                <DateTimeCell event={event} isReadOnly={state.isReadOnly} onSave={t => editState.saveDateTimes(event.id, t)} />
            </td>
            <EditableFieldCell className={styles.locationCell} value={state.isEditing('location') ? editState.cellValue : event.location}
                isEditing={state.isEditing('location')} onChange={editState.updateValue} onKeyDown={e => navState.handleKeyDown(e, rowIndex, 2)} onEdit={e => state.onEdit(e, 'location')} showEditIcon={!state.isReadOnly && !state.isEditing('location')} />
            <EditableFieldCell className={state.isEditing('description') || state.isExpanded ? styles.descExpanded : styles.descCell}
                value={state.isEditing('description') ? editState.cellValue : event.description} isEditing={state.isEditing('description')} onChange={editState.updateValue}
                onKeyDown={e => navState.handleKeyDown(e, rowIndex, 3)} onEdit={e => state.onEdit(e, 'description')} showEditIcon={!state.isReadOnly && !state.isEditing('description')} isTextarea />
            <ActionCell eventId={event.id} isReadOnly={state.isReadOnly} />
        </tr>
    );
}
