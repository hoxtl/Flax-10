import { DatePickerButton } from './DatePickerButton';

export function NavigationButtons({ onNavigate, selectedDate, onDatePick }) {
    return (
        <div className="nav-buttons">
            <button className="nav-arrow" onClick={() => onNavigate(-1)} aria-label="Previous period">‹</button>
            <TodayButton onDatePick={onDatePick} />
            <button className="nav-arrow" onClick={() => onNavigate(1)} aria-label="Next period">›</button>
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
        </div>
    );
}

function TodayButton({ onDatePick }) {
    const goToToday = () => onDatePick(getTodayDate());
    return <button className="btn-today" onClick={goToToday}>Today</button>;
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
