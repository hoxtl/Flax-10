import { useRef } from 'react';
import { parseDateInput } from '../utils/dateUtils';
import styles from './DatePickerButton.module.css';

export function DatePickerButton({ selectedDate, onDatePick }) {
    const ref = useRef(null);
    const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const value = !isNaN(dateObj) ? dateObj.toISOString().slice(0, 10) : '';
    const handleChange = (e) => {
        if (e.target.value) {
            onDatePick(parseDateInput(e.target.value));
        }
    };
    return (
        <>
            <button
                className={styles.btnCalendar}
                onClick={() => ref.current?.showPicker?.()}
                title="Choose date"
            >
                🗓️
            </button>
            <input
                ref={ref}
                type="date"
                className={styles.hiddenDateInput}
                value={value}
                onChange={handleChange}
            />
        </>
    );
}
