/*
    This function is used to handle the day column.
    It includes the hour cell and the column events.
*/
import { DraggableEvent } from '../DraggableEvent';
import { getHoursOfDay, calculateEventStyle } from '../DayView/dayViewHelpers';
import { useTimeSlotDrop } from '../../../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { isSameDay } from '../../../utils/dateUtils';
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
                        style={calculateEventStyle(event, SLOT_HEIGHT, events, date)}
                    />
                ))}
            </div>
        </div>
    );
}

function HourCell({ hour, date }) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);
    const { resizeHighlight } = useResizeHighlight();
    const isResizeTarget = resizeHighlight && resizeHighlight.hour === hour && isSameDay(resizeHighlight.date, date);
    const showHighlight = isOver || isResizeTarget;
    const quarter = isOver ? highlightQuarter : resizeHighlight?.quarter;
    return (
        <div
            className={`hour-cell${showHighlight ? ' drop-target' : ''}`}
            style={{ height: SLOT_HEIGHT }}
            {...mergedProps}
        >
            {isOver && quarter !== null && (
                <div className="quarter-highlight" style={{ top: `${quarter * 25}%` }} />
            )}
            {isResizeTarget && quarter !== null && (
                <div className="resize-line-highlight" style={{ top: `${quarter * 25}%` }} />
            )}
        </div>
    );
}
