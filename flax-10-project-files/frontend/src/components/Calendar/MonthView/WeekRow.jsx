import { memo } from 'react';
import { isSameMonth, overlapsDay } from '../utils/dateUtils';
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
        .filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), date))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}
