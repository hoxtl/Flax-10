/**
 * TableRow - Editable table row for calendar table view.
 * Supports inline editing with keyboard navigation.
 */

import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getEventType, isReadOnlyEvent } from '../utils/eventUtils';
import { EditableCell } from './cells/EditableCell';
import { TagEditCell } from './cells/TagEditCell';
import { LocationEditCell } from './cells/LocationEditCell';
import { DateTimeCell } from './cells/DateTimeCell';

import { useTags } from '../../../context/TagContext';
import { getEventTheme } from '../utils/eventStyleUtils';
import { isSameDay } from '../utils/dateUtils';
import { useEventActions } from '../hooks/useCalendarEvents';
import { useQuickActions } from '../hooks/useQuickActions';
import ConfirmModal from '../../common/confirm_modal/ConfirmModal';
import styles from './TableView.module.css';

function getSourceBadge(event) {
  const type = getEventType(event);
  if (type === 'module' && event.module?.name) return { label: event.module.name };
  if (type === 'society' && event.society_name) return { label: event.society_name, color: event.society_color };
  return null;
}

const SourceBadge = ({ badge }) => badge && (
  <span className={styles.sourceBadge} style={badge.color ? { backgroundColor: badge.color } : {}}>{badge.label}</span>
);

const EditIcon = ({ show, isRowHovered }) => {
  if (!show) return null;
  const cls = `${styles.editIcon} ${isRowHovered ? styles.editIconVisible : ''}`;
  return <Pencil size={14} className={cls} />;
};

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return <ConfirmModal title="Delete Event" message="Are you sure you want to delete this event? This action cannot be undone."
    onConfirm={onConfirm} onCancel={onCancel} confirmText="Delete" isDanger />;
}

function ActionCell({ eventId, isReadOnly }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { removeEvent } = useEventActions();
  if (isReadOnly) return <td className={styles.actionCell} />;
  return (
    <td className={styles.actionCell} onClick={e => e.stopPropagation()}>
      <button className={styles.trashBtn} onClick={() => setShowConfirm(true)}><Trash2 size={16} /></button>
      {showConfirm && <DeleteConfirmModal onConfirm={() => removeEvent(eventId)} onCancel={() => setShowConfirm(false)} />}
    </td>
  );
}

function NameCell({ event, isEditing, cellValue, updateValue, onKeyDown, onEdit, isReadOnly, quickAction, isRowHovered }) {
  return (
    <td className={styles.nameCell} onClick={onEdit}>
      <div className={styles.nameCellContent}>
        <EditableCell value={isEditing ? cellValue : event.title} isEditing={isEditing} onChange={updateValue} onKeyDown={onKeyDown} />
        <EditIcon show={!isReadOnly && !isEditing} isRowHovered={isRowHovered} />
        {isReadOnly && quickAction && <button className={styles.quickActionBtn} onClick={quickAction.onClick}>{quickAction.label}</button>}
      </div>
    </td>
  );
}

function TagCell({ event, tags, theme, isReadOnly, isEditing, cellValue, onEdit, onSave, badge, isRowHovered }) {
  return (
    <td className={styles.tagCell} onClick={e => !isReadOnly && e.stopPropagation()}>
      <TagEditCell event={event} tags={tags} theme={theme} isReadOnly={isReadOnly}
        isEditing={isEditing} editValue={cellValue} onEdit={onEdit} onSave={onSave} isRowHovered={isRowHovered} />
      <SourceBadge badge={badge} />
    </td>
  );
}

function EditableFieldCell({ value, isEditing, onChange, onKeyDown, onEdit, showEditIcon, isRowHovered, isTextarea, className }) {
  return (
    <td className={className} onClick={onEdit}>
      <div className={styles.cellWrapper}>
        <EditableCell value={value} isEditing={isEditing} onChange={onChange} onKeyDown={onKeyDown} isTextarea={isTextarea} />
        <EditIcon show={showEditIcon} isRowHovered={isRowHovered} />
      </div>
    </td>
  );
}

function useRowEditing(event, editState, onCellClick, forceReadOnly) {
  const isReadOnly = forceReadOnly || isReadOnlyEvent(event);
  const isEditing = (field) => editState.editingCell?.eventId === event.id && editState.editingCell?.field === field;
  const onEdit = (e, field) => {
    if (isReadOnly) return;
    e?.stopPropagation();
    onCellClick(event.id, field, field === 'tag' ? (event.tag || event.tag_id) : event[field]);
  };
  return { isReadOnly, isEditing, onEdit };
}

function useTableRowState(event, rowIndex, editState, navState, onCellClick, viewMode, forceReadOnly) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isReadOnly, isEditing, onEdit } = useRowEditing(event, editState, onCellClick, forceReadOnly);

  useEffect(() => {
    const field = navState.EDITABLE_COLUMNS[navState.focusedCell?.col];
    if (navState.focusedCell?.row === rowIndex && !isReadOnly && field && !isEditing(field)) onEdit(null, field);
  }, [navState.focusedCell, rowIndex, isReadOnly]);

  const isToday = viewMode !== 'day' && isSameDay(new Date(event.start_time), new Date());
  const rowClass = `${styles.row} ${isReadOnly ? styles.readOnly : ''} ${isExpanded ? styles.expanded : ''} ${isToday ? styles.todayRow : ''}`;
  return { isReadOnly, isExpanded, setIsExpanded, isEditing, onEdit, rowClass };
}

function DateCell({ event, state, editState, isRowHovered }) {
  return (
    <td className={styles.dateCell} onClick={e => !state.isReadOnly && e.stopPropagation()}>
      <DateTimeCell event={event} isReadOnly={state.isReadOnly} onSave={t => editState.saveDateTimes(event.id, t)} isRowHovered={isRowHovered} />
    </td>
  );
}

function LocationCell({ event, state, editState, navState, rowIndex, isRowHovered }) {
  const isEditing = state.isEditing('location');
  return (
  <td className={styles.locationCell} onClick={e => state.onEdit(e, 'location')}>
      <div className={styles.cellWrapper}>
        <LocationEditCell
          value={isEditing ? editState.cellValue : event.location}
          isEditing={isEditing}
          onChange={editState.updateValue}
          onSave={editState.saveEdit}
        />
        {!state.isReadOnly && !isEditing && (
          <EditIcon show={true} isRowHovered={isRowHovered} />
        )}
      </div>
    </td>
  );
}

function DescriptionCell({ event, state, editState, navState, rowIndex }) {
  const cls = state.isEditing('description') || state.isExpanded ? styles.descExpanded : styles.descCell;
  return (
    <EditableFieldCell className={cls} value={state.isEditing('description') ? editState.cellValue : event.description}
      isEditing={state.isEditing('description')} onChange={editState.updateValue} onKeyDown={e => navState.handleKeyDown(e, rowIndex, 3)}
      onEdit={e => state.onEdit(e, 'description')} showEditIcon={!state.isReadOnly && !state.isEditing('description')} isTextarea />
  );
}

function TableRowCells({ event, state, editState, navState, rowIndex, tags, theme, quickAction, isRowHovered }) {
  const common = { editState, navState, rowIndex, isRowHovered };
  return (
    <>
      <NameCell event={event} isEditing={state.isEditing('title')} cellValue={editState.cellValue}
        updateValue={editState.updateValue} onKeyDown={e => navState.handleKeyDown(e, rowIndex, 0)}
        onEdit={e => state.onEdit(e, 'title')} isReadOnly={state.isReadOnly} quickAction={quickAction} isRowHovered={isRowHovered} />
      <TagCell event={event} tags={tags} theme={theme} isReadOnly={state.isReadOnly} isEditing={state.isEditing('tag')}
        cellValue={editState.cellValue} onEdit={e => state.onEdit(e, 'tag')} onSave={editState.saveWithValue} 
        badge={getSourceBadge(event)} isRowHovered={isRowHovered} />
      <DateCell event={event} state={state} editState={editState} isRowHovered={isRowHovered} />
      <LocationCell event={event} state={state} editState={editState} navState={navState} rowIndex={rowIndex} isRowHovered={isRowHovered} />
      <DescriptionCell event={event} state={state} {...common} />
      <ActionCell eventId={event.id} isReadOnly={state.isReadOnly} />
    </>
  );
}

/** Table row component with inline editing support. */

export function TableRow({ event, rowIndex, editState, navState, onCellClick, viewMode, readOnly = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const state = useTableRowState(event, rowIndex, editState, navState, onCellClick, viewMode, readOnly);
  const { tags } = useTags();
  const theme = getEventTheme(event, { tags });
  const accentColor = theme.color;
  const quickAction = useQuickActions(event);
  return (
    <tr className={state.rowClass} style={accentColor ? { '--accent': accentColor } : undefined} 
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
        onClick={() => state.isReadOnly && state.setIsExpanded(p => !p)}>
      <TableRowCells event={event} state={state} editState={editState} navState={navState} 
        rowIndex={rowIndex} tags={tags} theme={theme} quickAction={quickAction} isRowHovered={isHovered} />
    </tr>
  );

}
