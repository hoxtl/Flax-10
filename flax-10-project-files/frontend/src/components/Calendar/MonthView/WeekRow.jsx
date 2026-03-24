/*
 * Month view week row component.
 */
import { memo } from 'react';
import { isSameMonth, overlapsDay, startOfDay } from '../utils/dateUtils';
import { getAllDayVisualRange, isAllDayEvent } from '../utils/eventDisplayUtils';
import { DayCell } from './DayCell';

export const WeekRow = memo(function WeekRow({ days, events, cur, onDateSelect, readOnly, onEventClick, onMoreClick, customTags }) {
    return (
        <div className="week-row">
            {days.map(d => (
                <DayCell key={d.toISOString()} day={d} events={getEventsForDay(events, d)} isCur={isSameMonth(d, cur)}
                    onDateSelect={onDateSelect} readOnly={readOnly} onEventClick={onEventClick} onMoreClick={onMoreClick} customTags={customTags} />
            ))}
        </div>
    );
});

function eventOverlapsDay(event, dayStart, dayEnd, date) {
    if (isAllDayEvent(event)) { const range = getAllDayVisualRange(event); return Boolean(range) && range.start < dayEnd && range.end >= dayStart; }
    return overlapsDay(new Date(event.start_time), new Date(event.end_time), date);
}

function sortDayEvents(a, b) {
    if (isAllDayEvent(a) !== isAllDayEvent(b)) return isAllDayEvent(a) ? -1 : 1;
    return new Date(a.start_time) - new Date(b.start_time);
}

function getEventsForDay(events, date) {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return events.filter(e => eventOverlapsDay(e, dayStart, dayEnd, date)).sort(sortDayEvents);
}
