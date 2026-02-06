/*
    This function is used to handle the day column.
    It includes the hour cell and the column events.
*/
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from '../DayView/dayViewHelpers';
import { useTimeSlotDrop } from '../useTimeSlotDrop';
import { SLOT_HEIGHT } from '../calendarConstants';

export function DayColumn({ date, events }) {
    const hours = getHoursOfDay();
    return (
        <div className="day-column">
            {hours.map(hour => (
                <HourCell key={hour} hour={hour} date={date} />
            ))}
            <div className="column-events">
                {events.map(event => (
                    <DraggableEvent
                        key={event.id}
                        event={event}
                        style={calculateEventStyle(event, SLOT_HEIGHT)}
                    />
                ))}
            </div>
        </div>
    );
}

function HourCell({ hour, date }) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);
    return (
        <div
            className={`hour-cell${isOver ? ' drop-target' : ''}`}
            style={{ height: SLOT_HEIGHT }}
            {...mergedProps}
        >
            {isOver && highlightQuarter !== null && (
                <div
                    className="quarter-highlight"
                    style={{ top: `${highlightQuarter * 25}%` }}
                />
            )}
        </div>
    );
}
