import { DraggableEvent } from '../../DraggableEvent';
import { calculateEventStyle } from '../../DayView/dayViewHelpers';
import { SLOT_HEIGHT } from '../../calendarConstants';

export function ColumnEvents({ events, date }) {
    return (
        <div className="column-events">
            {events.map(event => (
                <DraggableEvent
                    key={event.id}
                    event={event}
                    style={calculateEventStyle(event, SLOT_HEIGHT, events, date)}
                />
            ))}
        </div>
    );
}
