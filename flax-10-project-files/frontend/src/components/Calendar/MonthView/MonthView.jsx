import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';

/*
    Shows full month view of the calendar.
*/
export function MonthView() {
    const { selectedDate, events } = useCalendar();
    const dispatch = useCalendarDispatch();
    const weeks = getMonthWeeks(selectedDate);
    return (
        <div className="month-view">
            <WeekdayHeader />
            <div className="month-grid">
                {weeks.map((week, i) => (
                    <WeekRow key={i} days={week} events={events} cur={selectedDate} dispatch={dispatch} />
                ))}
            </div>
        </div>
    );
}

function getMonthWeeks(date) {
    const weeks = [];
    const current = getStartDate(date);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    while (shouldContinue(current, last)) {
        weeks.push(generateWeek(current));
    }
    return weeks;
}

function shouldContinue(current, last) {
    if (current <= last) return true;
    return current.getDay() !== 0;
}

function getStartDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function generateWeek(current) {
    const week = [];
    for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return week;
}