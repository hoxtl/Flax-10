import { useTags } from '../../../context/TagContext';
import { isSameDay } from '../../../utils/dateUtils';

export function HoverSummary({ events, date }) {
    if (!events || events.length === 0) return <EmptySummary />;
    return <EventList events={events} date={date} />;
}

function EmptySummary() {
    const style = { fontStyle: 'italic', color: '#9ca3af' };
    return (
        <div className="hover-summary">
            <div className="summary-event" style={style}>No events</div>
        </div>
    );
}

function EventList({ events, date }) {
    return (
        <div className="hover-summary">
            {events.slice(0, 5).map(e => <SummaryItem key={e.id} event={e} date={date} />)}
            {events.length > 5 && <MoreCount count={events.length - 5} />}
        </div>
    );
}

function SummaryItem({ event, date }) {
    const { getTag } = useTags();
    const tag = getTag(event.tag_name || event.tag);
    const color = tag?.color || '#3b82f6';
    return (
        <div className="summary-event">
            <div className="event-dot" style={{ backgroundColor: color }} />
            <span className="event-title">{event.title}</span>
            <span className="event-time">{getTimeString(event, date)}</span>
        </div>
    );
}

function MoreCount({ count }) {
    const style = { color: '#6b7280', paddingLeft: '14px' };
    return (
        <div className="summary-event" style={style}>
            +{count} more events
        </div>
    );
}

function getTimeString(event, date) {
    if (isAllDay(event) || isInferredAllDay(event)) return 'All Day';
    if (isSameDay(new Date(event.start_time), date) && isSameDay(new Date(event.end_time), date)) {
        return formatTime(new Date(event.start_time));
    }
    if (isSameDay(new Date(event.start_time), date)) return formatTime(new Date(event.start_time));
    if (isSameDay(new Date(event.end_time), date)) return `Ends ${formatTime(new Date(event.end_time))}`;
    return 'All Day';
}

function formatTime(d) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isAllDay(event) {
    return event.all_day || event.is_all_day || event.allDay;
}

function isInferredAllDay(event) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    return start.getHours() === 0 && start.getMinutes() === 0 &&
        end.getHours() === 0 && end.getMinutes() === 0;
}
