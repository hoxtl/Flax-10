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

function getEventsForDay(events, date) {
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return events
        .filter(e => {
            if (isAllDayEvent(e)) {
                const range = getAllDayVisualRange(e);
                return Boolean(range) && range.start < dayEnd && range.end >= dayStart;
            }

            const start = new Date(e.start_time);
            const end = new Date(e.end_time);
            return overlapsDay(start, end, date);
        })
        .sort((a, b) => {
            if (isAllDayEvent(a) !== isAllDayEvent(b)) return isAllDayEvent(a) ? -1 : 1;
            return new Date(a.start_time) - new Date(b.start_time);
        });
}
