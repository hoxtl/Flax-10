import { memo } from 'react';
import { isSameMonth, overlapsDay, isSameDay } from '../utils/dateUtils';
import { isAllDayEvent } from '../utils/eventDisplayUtils';
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

function getEventsForDay(events, date) {
    return events
        .filter(e => {
            const start = new Date(e.start_time);
            const end = new Date(e.end_time);
            if (isAllDayEvent(e) && end <= start) return isSameDay(start, date);
            return overlapsDay(start, end, date);
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}
