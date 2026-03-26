import { EventDot, MoreEvents } from './EventDot';

export function DayEvents({ events, onEventClick, onMoreClick, customTags, readOnly }) {
    return (
        <div className="day-events">
            {events.slice(0, 3).map(e => (
                <EventDot key={e.id} e={e} onEventClick={onEventClick} customTags={customTags} readOnly={readOnly} />
            ))}
            {events.length > 3 && (
                <MoreEvents count={events.length - 3} onClick={onMoreClick} />
            )}
        </div>
    );
}
