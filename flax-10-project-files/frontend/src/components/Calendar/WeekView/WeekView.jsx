import { useRef } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { getWeekDays, isSameDay } from '../../../utils/dateUtils';
import { DayColumn } from './DayColumn';
import { TimeLabels } from './TimeLabels';
import { useAutoScroll } from '../useAutoScroll';
import './WeekView.css';

/**
 * Week view shows 7 day columns with hour rows.
 * Each column shows that day's events.
 */
export function WeekView() {
    const { selectedDate, events } = useCalendar();
    const scrollRef = useRef(null);
    const weekDays = getWeekDays(selectedDate);
    useAutoScroll(scrollRef, getEventsForWeek(events, weekDays));
    return (
        <div className="week-view" ref={scrollRef}>
            <WeekHeader days={weekDays} />
            <div className="week-grid">
                <TimeLabels />
                {weekDays.map(day => <DayColumn key={day.toISOString()} date={day} events={getEventsForDay(events, day)} />)}
            </div>
        </div>
    );
}

/**
 * Filter events for the entire week
 */
function getEventsForWeek(events, weekDays) {
    return events.filter(e => weekDays.some(day => isSameDay(new Date(e.start_time), day)));
}

/**
 * Header row showing day names and dates.
 */
function WeekHeader({ days }) {
    const dispatch = useCalendarDispatch();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const handleDayClick = (day) => {
        dispatch({ type: 'SET_SELECTED_DATE', payload: day });
        dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
    };
    return (
        <div className="week-header">
            <div className="time-gutter" />
            {days.map((day, i) => <DayHeaderCell key={day.toISOString()} day={day} name={dayNames[i]} isToday={isSameDay(day, today)} onClick={() => handleDayClick(day)} />)}
        </div>
    );
}

function DayHeaderCell({ day, name, isToday, onClick }) {
    return (
        <div className={`day-header ${isToday ? 'is-today' : ''}`}>
            <span className="day-name">{name}</span>
            <span className="day-number" onClick={onClick}>{day.getDate()}</span>
        </div>
    );
}

/**
 * Filters events to only those starting on the given day.
 */
function getEventsForDay(events, date) {
    return events.filter(e => isSameDay(new Date(e.start_time), date));
}