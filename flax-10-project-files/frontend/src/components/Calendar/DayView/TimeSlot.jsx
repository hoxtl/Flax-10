import { EventCard } from "../EventCard";
import { formatHour } from "./dayViewHelpers.js";
import { useDrop } from "react-dnd";
import { useEventActions } from "../../../context/EventContext";

/**
 * A single hour slot in the day view (e.g. 9 AM, 10 AM)
 * Shows the time label on the left and events on the right
 * also handles drag-and-drop: you can drop a tag here to create an event
 */
export function TimeSlot({ hour, events, date }) {
    const { addEvent } = useEventActions();
    // When a tag is dropped on this slot, create an event at this hour
    const handleDrop = (payload) => { createEventFromTag(payload.data, date, hour, addEvent); };
    // useDrop gives us props to make this element a drop target
    const { dropProps, isOver } = useDrop({ accept: ['TAG'], onDrop: handleDrop, });
    const eventCards = events.map(event => (<EventCard key={event.id} event={event} />));
    const label = <div className="time-label">{formatHour(hour)}</div>;
    const content = <div className="slot-content">{eventCards}</div>;
    return <div className={`time-slot ${isOver ? 'drop-target' : ''}`} {...dropProps}>{label}{content}</div>;
}

/**
 * Create a new calendar event from a dragged tag.
 * Uses the tag's name as the event title 
 * and its default duration for length
 */
function createEventFromTag(tag, date, hour, addEvent) {
    // Set the start time to be the beginning of this hour
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    // End time = start time + tag's default duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + tag.defaultDuration);

    addEvent({
        title: tag.name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tag: tag.id,
    });
}
