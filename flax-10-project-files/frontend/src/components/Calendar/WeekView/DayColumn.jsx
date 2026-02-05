import { useCallback } from 'react';
import { useDrop } from '../../../hooks/useDragDrop';
import { useEventActions } from '../../../hooks/useCalendarEvents';
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from '../DayView/dayViewHelpers';
import { SLOT_HEIGHT, getMinuteOffset } from '../calendarConstants';

/**
 * A single day column in the week view.
 * Shows hour cells and positions events on top.
 */
export function DayColumn({ date, events }) {
    const hours = getHoursOfDay();
    const hourCells = hours.map(hour => (
        <HourCell key={hour} hour={hour} date={date} />
    ));
    const eventElements = events.map(event => (
        <DraggableEvent
            key={event.id}
            event={event}
            style={calculateEventStyle(event, SLOT_HEIGHT)}
        />
    ));
    return (
        <div className="day-column">
            {hourCells}
            <div className="column-events">
                {eventElements}
            </div>
        </div>
    );
}

/**
 * A single hour cell that acts as a drop target.
 */
function HourCell({ hour, date }) {
    const { addEvent, editEvent } = useEventActions();
    const handleDrop = useCallback((payload, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const minuteOffset = getMinuteOffset(e.clientY, rect.top);
        const totalMinutes = hour * 60 + minuteOffset;
        if (payload.type === 'TAG') {
            createFromTag(payload.data, date, totalMinutes, addEvent);
        } else if (payload.type === 'EVENT') {
            moveEvent(payload.data, date, totalMinutes, editEvent);
        }
    }, [hour, date, addEvent, editEvent]);
    const { dropProps, isOver } = useDrop({
        accept: ['TAG', 'EVENT'],
        onDrop: handleDrop,
    });
    const className = `hour-cell ${isOver ? 'drop-target' : ''}`;
    return <div className={className} style={{ height: SLOT_HEIGHT }} {...dropProps} />;
}

/**
 * Creates a new event from a dropped tag.
 */
function createFromTag(tag, date, startMinutes, addEvent) {
    const start = new Date(date);
    start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (tag.default_duration || 60));

    addEvent({
        title: tag.name,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        tag: tag.id,
    });
}

/**
 * Moves an existing event to a new time.
 */
function moveEvent(event, date, startMinutes, editEvent) {
    const duration = new Date(event.end_time) - new Date(event.start_time);

    const newStart = new Date(date);
    newStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    editEvent(event.id, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
    });
}