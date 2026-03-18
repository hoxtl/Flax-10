import { useState } from 'react';
import { Pencil } from 'lucide-react';
import DateTimePicker from '../../../common/inputs/DateTimePicker';
import { validateEventTimes } from '../../utils/dateValidation';
import styles from '../TableView.module.css';
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

export function DateTimeCell({ event, isReadOnly, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [startValue, setStartValue] = useState(toISOString(event.start_time));
    const [endValue, setEndValue] = useState(toISOString(event.end_time));
    const [error, setError] = useState(null);

    const handleClick = () => {
        if (isReadOnly) return;
        setStartValue(toISOString(event.start_time));
        setEndValue(toISOString(event.end_time));
        setError(null);
        setIsEditing(true);
    };

    const handleSave = () => {
        const validationError = validateEventTimes({ start_time: startValue, end_time: endValue });
        if (validationError) { setError(validationError); return; }
        onSave({ start_time: startValue, end_time: endValue });
        setIsEditing(false);
    };

    if (isEditing && !isReadOnly) {
        return <DateEditForm startValue={startValue} endValue={endValue} onStartChange={setStartValue}
            onEndChange={setEndValue} error={error} onSave={handleSave} onCancel={() => setIsEditing(false)} />;
    }

    return (
        <div className={styles.dateCellContent} onClick={handleClick}>
            <span className={styles.cellText}>{formatTimeRange(event)}</span>
            {!isReadOnly && <Pencil size={14} className={styles.editIcon} />}
        </div>
    );
}

export { isAllDay, formatTimeRange };
