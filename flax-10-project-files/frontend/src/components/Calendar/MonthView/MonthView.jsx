import { useCalendarData, useCalendarDispatch } from '../../../context/CalendarContext';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';

/*
    Shows full month view of the calendar.
    Props are optional - falls back to CalendarContext if not provided.
*/
export function MonthView({ selectedDate: propDate, events: propEvents, onDateSelect, readOnly }) {
    const data = useCalendarData({ selectedDate: propDate, events: propEvents });
    const contextDispatch = useCalendarDispatch();
    const weeks = getMonthWeeks(data.selectedDate);

    const handleDateSelect = onDateSelect || createDispatchHandler(contextDispatch);

    return (
        <div className="month-view">
            <WeekdayHeader />
            <MonthGrid weeks={weeks} events={data.events} cur={data.selectedDate} onDateSelect={handleDateSelect} readOnly={readOnly} />
        </div>
    );
}

function createDispatchHandler(dispatch) {
    if (!dispatch) return null;
    return (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
}

function MonthGrid({ weeks, events, cur, onDateSelect, readOnly }) {
    return (
        <div className="month-grid">
            {weeks.map((week, i) => (
                <WeekRow key={i} days={week} events={events} cur={cur} onDateSelect={onDateSelect} readOnly={readOnly} />
            ))}
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