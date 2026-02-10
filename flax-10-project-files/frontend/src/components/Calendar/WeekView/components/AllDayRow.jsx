import { getAllDayVisualRange } from '../../../../utils/eventDisplayUtils';
import { useEventModal } from '../../../../context/CalendarContext';
import { useTags } from '../../../../context/TagContext';
import { calculateBarStyle } from './allDayRowHelpers';
import './AllDayRow.css';

export function AllDayRow({ days, events }) {
    const rowEvents = useRowEvents(days, events);

    return (
        <div className="all-day-row">
            <div className="all-day-label">All-day</div>
            <div className="all-day-grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map(d => <div key={d.toISOString()} className="all-day-cell" />)}
                <AllDayEvents events={rowEvents} days={days} />
            </div>
        </div>
    );
}

function useRowEvents(days, events) {
    return events.filter(e => {
        const range = getAllDayVisualRange(e);
        if (!range) return false;
        const weekStart = new Date(days[0]);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(days[days.length - 1]);
        weekEnd.setHours(23, 59, 59, 999);
        return range.start <= weekEnd && range.end >= weekStart;
    });
}

function AllDayEvents({ events, days }) {
    return events.map(e => <AllDayEventBar key={e.id} event={e} days={days} />);
}

function AllDayEventBar({ event, days }) {
    const { openModal } = useEventModal();
    const { getTag } = useTags();
    const tag = getTag(event.tag);
    const color = tag?.color || '#3b82f6';

    const style = calculateBarStyle(event, days);
    if (!style) return null;

    return (
        <div
            className="all-day-event-bar"
            style={{ ...style, backgroundColor: color }}
            onClick={(ev) => { ev.stopPropagation(); openModal(event); }}
        >
            {event.title}
        </div>
    );
}
