import { isSameMonth, isSameDay } from '../../../utils/dateUtils';
import { DayCell } from './DayCell';

export function WeekRow({ days, events, cur, dispatch }) {
    return (
        <div className="week-row">
            {days.map(d => (
                <DayCell key={d.toISOString()} day={d} events={getEventsForDay(events, d)} isCur={isSameMonth(d, cur)} dispatch={dispatch} />
            ))}
        </div>
    );
}

function getEventsForDay(events, date) {
    return events
        .filter(e => isSameDay(new Date(e.start_time), date))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}
