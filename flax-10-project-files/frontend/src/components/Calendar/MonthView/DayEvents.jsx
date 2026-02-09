import { EventDot, MoreEvents } from './EventDot';

export function DayEvents({ events }) {
    return (
        <div className="day-events">
            {events.slice(0, 3).map(e => <EventDot key={e.id} e={e} />)}
            {events.length > 3 && <MoreEvents count={events.length - 3} />}
        </div>
    );
}
