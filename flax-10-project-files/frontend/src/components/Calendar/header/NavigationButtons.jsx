import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { parseDateInput, isSameDay, getWeekDays, isSameMonth } from '../../../utils/dateUtils';

export function NavigationButtons({ onNavigate, selectedDate, onDatePick }) {
    return (
        <div className="nav-buttons">
            <button onClick={() => onNavigate(-1)}>&lt;</button>
            <button onClick={() => onNavigate(1)}>&gt;</button>
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
            <TodayButton selectedDate={selectedDate} onDatePick={onDatePick} />
        </div>
    );
}

function DatePickerButton({ selectedDate, onDatePick }) {
    const ref = useRef(null);
    const value = selectedDate.toISOString().slice(0, 10);
    const handleChange = (e) => onDatePick(parseDateInput(e.target.value));
    return (
        <>
            <button className="btn-calendar" onClick={() => ref.current?.showPicker?.()}>🗓️</button>
            <input ref={ref} type="date" className="hidden-date-input" value={value} onChange={handleChange} />
        </>
    );
}

function TodayButton({ selectedDate, onDatePick }) {
    const { viewMode } = useCalendar();
    if (isTodayVisible(viewMode, selectedDate)) return null;
    const goToToday = () => onDatePick(getTodayDate());
    return <button className="btn-today" onClick={goToToday}>Today</button>;
}

function isTodayVisible(viewMode, date) {
    const today = new Date();
    if (viewMode === 'day') return isSameDay(date, today);
    if (viewMode === 'week') return getWeekDays(date).some(d => isSameDay(d, today));
    if (viewMode === 'month') return isSameMonth(date, today);
    return false;
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
