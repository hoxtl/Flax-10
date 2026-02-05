import { useCallback } from "react";
import { formatHour } from "./dayViewHelpers";
import { useDrop } from '../../../hooks/useDragDrop';
import { useEventActions } from "../../../hooks/useCalendarEvents";
import { getMinuteOffset, SLOT_HEIGHT } from "../calendarConstants";

/**
 * A single hour slot in the day view.
 * Acts as a drop target for events and tags.
 */
export function TimeSlot({ hour, date }) {
    const { addEvent, editEvent } = useEventActions();
    // Handle drops - either create new event from tag or move existing event
    const handleDrop = useCallback((payload, e) => {
        const minutes = calculateDropMinutes(hour, e);
        if (payload.type === 'TAG') {
            createEventFromTag(payload.data, date, minutes, addEvent);
        } else if (payload.type === 'EVENT') {
            moveEventToTime(payload.data, date, minutes, editEvent);
        }
    }, [hour, date, addEvent, editEvent]);
    const { dropProps, isOver } = useDrop({ accept: ['TAG', 'EVENT'], onDrop: handleDrop });
    const className = `time-slot ${isOver ? 'drop-target' : ''}`;
    return (
        <div className={className} style={{ height: SLOT_HEIGHT }} {...dropProps}>
            <span className="time-label">{formatHour(hour)}</span>
        </div>
    );
}

/**
 * Calculates the exact minute based on where in the slot the user dropped.
 * Uses the hour base plus the offset within the slot.
 */
function calculateDropMinutes(hour, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMinutes = getMinuteOffset(e.clientY, rect.top);
    return hour * 60 + offsetMinutes;
}

/**
 * Creates a new event when a tag is dropped onto a time slot.
 * Uses the tag's default duration.
 */
function createEventFromTag(tag, date, startMinutes, addEvent) {
    const startTime = createDateWithMinutes(date, startMinutes);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (tag.default_duration || 60));

    addEvent({
        title: tag.name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tag: tag.id,
    });
}

/**
 * Moves an existing event to a new time slot.
 * Preserves the event's original duration.
 */
function moveEventToTime(event, date, startMinutes, editEvent) {
    const duration = new Date(event.end_time) - new Date(event.start_time);
    const newStart = createDateWithMinutes(date, startMinutes);
    const newEnd = new Date(newStart.getTime() + duration);

    editEvent(event.id, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
    });
}

/**
 * Creates a Date object set to a specific minute of the day.
 */
function createDateWithMinutes(date, totalMinutes) {
    const result = new Date(date);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    result.setHours(hours, minutes, 0, 0);
    return result;
}