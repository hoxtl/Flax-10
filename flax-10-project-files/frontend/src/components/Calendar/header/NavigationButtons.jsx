import { useRef } from 'react';
import { parseDateInput } from '../../../utils/dateUtils';

export function NavigationButtons({ onNavigate, selectedDate, onDatePick }) {
    return (
        <div className="nav-buttons">
            <button onClick={() => onNavigate(-1)}>&lt;</button>
            <button onClick={() => onNavigate(1)}>&gt;</button>
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
            <TodayButton onDatePick={onDatePick} />
        </div>
    );
}

function DatePickerButton({ selectedDate, onDatePick }) {
    const ref = useRef(null);
    const value = selectedDate.toISOString().slice(0, 10);
    const handleChange = (e) => onDatePick(parseDateInput(e.target.value));

    return (
        <>
            <button className="btn-calendar" onClick={() => ref.current?.showPicker?.()}>📅</button>
            <input ref={ref} type="date" className="hidden-date-input" value={value} onChange={handleChange} />
        </>
    );
}

function TodayButton({ onDatePick }) {
    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        onDatePick(today);
    };
    return <button className="btn-today" onClick={goToToday}>Today</button>;
}
