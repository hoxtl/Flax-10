import { DraggableEvent } from '../../DraggableEvent';
import { calculateEventStyle } from '../../DayView/dayViewHelpers';
import { getEventKey } from '../../utils/overlapUtils';
import { SLOT_HEIGHT } from '../../calendarConstants';

export function ColumnEvents({ events, date, readOnly }) {
    return (
        <div className="column-events">
            {events.map(event => (
                <DraggableEvent
                    key={getEventKey(event)}
                    event={event}
                    style={calculateEventStyle(event, SLOT_HEIGHT, events, date)}
                    readOnly={readOnly}
                />
            ))}
        </div>
    );
}
