import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';

/*
    Shows full month view of the calendar.
    Props are optional - falls back to CalendarContext if not provided.
*/
export function MonthView({ selectedDate, events, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    const { selectedDate: contextDate, events: contextEvents, readOnly: contextReadOnly } = useCalendar();
    const dispatch = useCalendarDispatch();
    const cur = selectedDate || contextDate;
    const evs = events || contextEvents || [];
    const isReadOnly = readOnly ?? contextReadOnly;

    const handleMoreClick = (date) => {
        if (onMoreClick) {
            onMoreClick(date);
        } else {
            dispatch?.({ type: 'SET_SELECTED_DATE', payload: date });
            dispatch?.({ type: 'SET_VIEW_MODE', payload: 'day' });
        }
    };

    return (
        <div className="month-view">
            <MonthGrid
                cur={cur}
                events={evs}
                onDateSelect={onDateSelect}
                readOnly={isReadOnly}
                onEventClick={onEventClick}
                onMoreClick={handleMoreClick}
                customTags={customTags}
            />
        </div>
    );
}

function MonthGrid({ cur, events, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    const weeks = getMonthWeeks(cur);
    return (
        <div className="month-grid">
            <WeekdayHeader />
            {weeks.map((w, i) => (
                <WeekRow
                    key={i}
                    days={w}
                    events={events}
                    cur={cur}
                    onDateSelect={onDateSelect}
                    readOnly={readOnly}
                    onEventClick={onEventClick}
                    onMoreClick={onMoreClick}
                    customTags={customTags}
                />
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