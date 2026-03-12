import DateTimePicker from '../../common/inputs/DateTimePicker';
import styles from './DatePickerButton.module.css';

export function DatePickerButton({ selectedDate, onDatePick }) {
    const value = selectedDate instanceof Date ? selectedDate.toISOString().slice(0, 10) : selectedDate || '';

    return (
        <DateTimePicker
            value={value}
            dateOnly={true}
            onChange={(val) => val && onDatePick(new Date(val))}
            customTrigger={<button className={styles.btnCalendar} title="Choose date">🗓️</button>}
        />
    );
}
