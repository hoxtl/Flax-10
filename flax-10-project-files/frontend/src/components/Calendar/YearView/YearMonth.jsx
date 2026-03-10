import { memo } from 'react';
import { useCalendarDispatch } from '../../../context/CalendarContext';
import { YearDay } from './YearDay';

export const YearMonth = memo(function YearMonth({ year, monthIndex, events }) {
    const date = new Date(year, monthIndex, 1);
    const dispatch = useCalendarDispatch();
    return (
        <div className="year-month">
            <MonthTitle date={date} dispatch={dispatch} />
            <MonthGrid year={year} monthIndex={monthIndex} events={events} offset={date.getDay()} />
        </div>
    );
});

function MonthTitle({ date, dispatch }) {
    const name = date.toLocaleString('default', { month: 'long' });
    const onClick = () => goToMonth(dispatch, date);
    return (
        <div className="year-month-title" onClick={onClick} style={{ cursor: 'pointer' }}>
            {name}
        </div>
    );
}

function MonthGrid({ year, monthIndex, events, offset }) {
    const days = getMonthDays(year, monthIndex);
    return (
        <div className="year-month-grid">
            <WeekHeaders />
            <EmptySlots count={offset} />
            {days.map(d => <YearDay key={d.toISOString()} date={d} events={events} />)}
        </div>
    );
}

function WeekHeaders() {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days.map((d, i) => <div key={i} className="year-day-header">{d}</div>);
}

function EmptySlots({ count }) {
    return Array(count).fill(null).map((_, i) => <div key={`empty-${i}`} />);
}

function getMonthDays(year, month) {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function goToMonth(dispatch, date) {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
}
