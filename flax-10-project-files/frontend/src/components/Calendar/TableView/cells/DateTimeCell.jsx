import { useState } from 'react';
import { Pencil } from 'lucide-react';
import DateTimePicker from '../../../common/inputs/DateTimePicker';
import styles from '../TableView.module.css';

function isAllDay(event) {
    if (event.all_day || event.is_all_day) return true;
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const endMidnight = end.getHours() === 0 && end.getMinutes() === 0;
    const nextDay = end.getDate() !== start.getDate() || end.getMonth() !== start.getMonth();
    return startMidnight && endMidnight && nextDay;
}

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

export function DateTimeCell({ event, isReadOnly, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [startValue, setStartValue] = useState(toISOString(event.start_time));
    const [endValue, setEndValue] = useState(toISOString(event.end_time));

    const handleClick = () => {
        if (isReadOnly) return;
        setStartValue(toISOString(event.start_time));
        setEndValue(toISOString(event.end_time));
        setIsEditing(true);
    };

    const handleSave = () => {
        if (startValue && endValue) {
            onSave({ start_time: startValue, end_time: endValue });
        }
        setIsEditing(false);
    };

    if (isEditing && !isReadOnly) {
        return (
            <div className={styles.dateEditContainer}>
                <div className={styles.dateEditRow}>
                    <span className={styles.dateEditLabel}>Start:</span>
                    <DateTimePicker value={startValue} onChange={setStartValue} placeholder="Start" />
                </div>
                <div className={styles.dateEditRow}>
                    <span className={styles.dateEditLabel}>End:</span>
                    <DateTimePicker value={endValue} onChange={setEndValue} placeholder="End" />
                </div>
                <div className={styles.dateEditActions}>
                    <button className={styles.dateEditBtn} onClick={handleSave}>Save</button>
                    <button className={styles.dateEditBtnCancel} onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dateCellContent} onClick={handleClick}>
            <span className={styles.cellText}>{formatTimeRange(event)}</span>
            {!isReadOnly && <Pencil size={14} className={styles.editIcon} />}
        </div>
    );
}

export { isAllDay, formatTimeRange };
