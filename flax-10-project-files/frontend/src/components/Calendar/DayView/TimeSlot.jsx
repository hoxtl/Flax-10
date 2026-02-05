import { useCallback } from "react";
import { formatHour } from "./dayViewHelpers";
import { useDrop } from "react-dnd";
import { useEventActions } from "../../../context/EventContext";
import { getMinuteOffset, SLOT_HEIGHT } from "../calendarConstants";

/**
 * A single hour slot that acts as a drop target.
 * Handles drops from both tags (create new event) and existing events (move event).
 * Also handles clicks to create events at a specific time.
 */
export function TimeSlot({ hour, events, date }) {
    const { addEvent, editEvent } = useEventActions();
    const getMins = (e) => hour * 60 + getMinuteOffset(e.clientY, e.currentTarget.getBoundingClientRect().top);
    const onDrop = (p, e) => p.type === 'TAG'
        ? createEventFromTag(p.data, date, getMins(e), addEvent)
        : moveEventToTime(p.data, date, getMins(e), editEvent);
    const { dropProps, isOver } = useDrop({ accept: ['TAG', 'EVENT'], onDrop });
    return <div className={`time-slot ${isOver ? 'drop-target' : ''}`} style={{ height: 60 }} {...dropProps}><span className="time-label">{formatHour(hour)}</span></div>;
}

// Creates a new event when a tag is dropped
function createEventFromTag(tag, date, startMinutes, addEvent) {
    const startTime = dateWithMinutes(date, startMinutes);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + tag.default_duration);

    addEvent({
        title: tag.name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tag: tag.id,
    });
}

// Moves an existing event to a new time (preserves duration)
function moveEventToTime(event, date, startMinutes, editEvent) {
    const duration = new Date(event.end_time) - new Date(event.start_time);
    const newStart = dateWithMinutes(date, startMinutes);
    const newEnd = new Date(newStart.getTime() + duration);

    editEvent(event.id, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
    });
}

// Helper to create a Date at a specific minute of the day
function dateWithMinutes(date, totalMinutes) {
    const result = new Date(date);
    result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return result;
}