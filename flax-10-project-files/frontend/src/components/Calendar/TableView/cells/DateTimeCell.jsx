/**
 * DateTimeCell - Date/time display and editing for table view.
 * Shows formatted time range with inline date picker on edit.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import DateTimePicker from '../../../common/inputs/DateTimePicker';
import { validateEventTimes } from '../../utils/dateValidation';
import styles from './DateTimeCell.module.css';
import commonStyles from '../TableView.module.css';
import { isAllDay } from '../../utils/eventUtils';

function formatTimeRange(event) {
    if (isAllDay(event)) return 'All day';
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr}, ${startTime} - ${endTime}`;
}

function toISOString(date) {
    if (!date) return '';
    const d = new Date(date);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DateEditForm({ startValue, endValue, onStartChange, onEndChange, error, onSave, onCancel }) {
    return (
        <div className={styles.dateEditContainer}>
            <DateEditRow label="Start:" value={startValue} onChange={onStartChange} />
            <DateEditRow label="End:" value={endValue} onChange={onEndChange} />
            {error && <span className={styles.dateEditError}>{error}</span>}
            <DateEditActions onSave={onSave} onCancel={onCancel} />
        </div>
    );
}

function DateEditRow({ label, value, onChange }) {
    return (
        <div className={styles.dateEditRow}>
            <span className={styles.dateEditLabel}>{label}</span>
            <DateTimePicker value={value} onChange={onChange} placeholder={label.replace(':', '')} />
        </div>
    );
}

function DateEditActions({ onSave, onCancel }) {
    return (
        <div className={styles.dateEditActions}>
            <button className={styles.dateEditBtn} onClick={onSave}>Save</button>
            <button className={styles.dateEditBtnCancel} onClick={onCancel}>Cancel</button>
        </div>
    );
}

function useDateTimeEditState(event) {
    const [isEditing, setIsEditing] = useState(false);
    const [startValue, setStartValue] = useState(toISOString(event.start_time));
    const [endValue, setEndValue] = useState(toISOString(event.end_time));
    const [error, setError] = useState(null);
    return { isEditing, setIsEditing, startValue, setStartValue, endValue, setEndValue, error, setError };
}

function DateDisplayView({ event, isReadOnly, onClick, isRowHovered }) {
    const cls = `${commonStyles.editIcon} ${isRowHovered ? commonStyles.editIconVisible : ''}`;
    return (
        <div className={styles.dateCellContent} onClick={onClick}>
            <span className={commonStyles.cellText}>{formatTimeRange(event)}</span>
            {!isReadOnly && <Pencil size={14} className={cls} />}
        </div>
    );
}

function createClickHandler(event, isReadOnly, state) {
    return () => {
        if (isReadOnly) return;
        state.setStartValue(toISOString(event.start_time));
        state.setEndValue(toISOString(event.end_time));
        state.setError(null);
        state.setIsEditing(true);
    };
}

function createSaveHandler(state, onSave) {
    return () => {
        const err = validateEventTimes({ start_time: state.startValue, end_time: state.endValue });
        if (err) { state.setError(err); return; }
        onSave({ start_time: state.startValue, end_time: state.endValue });
        state.setIsEditing(false);
    };
}

/** Table cell for viewing and editing event date/time with validation. */
export function DateTimeCell({ event, isReadOnly, onSave, isRowHovered }) {
    const state = useDateTimeEditState(event);
    const handleClick = createClickHandler(event, isReadOnly, state);
    const handleSave = createSaveHandler(state, onSave);
    if (state.isEditing && !isReadOnly) {
        return <DateEditForm startValue={state.startValue} endValue={state.endValue} onStartChange={state.setStartValue}
            onEndChange={state.setEndValue} error={state.error} onSave={handleSave} onCancel={() => state.setIsEditing(false)} />;
    }
    return <DateDisplayView event={event} isReadOnly={isReadOnly} onClick={handleClick} isRowHovered={isRowHovered} />;
}

export { isAllDay, formatTimeRange };
