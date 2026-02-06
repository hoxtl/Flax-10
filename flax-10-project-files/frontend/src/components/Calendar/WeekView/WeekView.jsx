import { useRef } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
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
    const dayColumns = weekDays.map(day => (
        <DayColumn
            key={day.toISOString()}
            date={day}
            events={getEventsForDay(events, day)}
        />
    ));
    return (
        <div className="week-view" ref={scrollRef}>
            <WeekHeader days={weekDays} />
            <div className="week-grid">
                <TimeLabels />
                {dayColumns}
            </div>
        </div>
    );
}

/**
 * Filter events for the entire week
 */
function getEventsForWeek(events, weekDays) {
    return events.filter(e => {
        const d = new Date(e.start_time);
        return weekDays.some(day => isSameDay(d, day));
    });
}

/**
 * Header row showing day names and dates.
 */
function WeekHeader({ days }) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const headerCells = days.map((day, index) => {
        const isToday = isSameDay(day, today);
        return (
            <div key={day.toISOString()} className={`day-header ${isToday ? 'is-today' : ''}`}>
                <span className="day-name">{dayNames[index]}</span>
                <span className="day-number">{day.getDate()}</span>
            </div>
        );
    });
    return (
        <div className="week-header">
            <div className="time-gutter" />
            {headerCells}
        </div>
    );
}

/**
 * Filters events to only those starting on the given day.
 */
function getEventsForDay(events, date) {
    return events.filter(event => {
        const eventDate = new Date(event.start_time);
        return isSameDay(eventDate, date);
    });
}