import { useState, useCallback, useRef } from 'react';
import { useDrag } from '../../hooks/useDragDrop';
import { useEventActions } from '../../hooks/useCalendarEvents';
import { formatTime } from '../../utils/dateUtils';
import { SLOT_HEIGHT, SNAP_INTERVAL, MIN_EVENT_DURATION, pixelsToMinutes } from './calendarConstants';
import './DraggableEvent.css';

const EventView = ({ eventRef, className, style, dragProps, event, onResize }) => <div ref={eventRef} className={className} style={style} {...dragProps}><div className="event-content"><div className="event-title">{event.title}</div><div className="event-time">{formatTime(new Date(event.start_time))} - {formatTime(new Date(event.end_time))}</div></div><div className="resize-handle" onMouseDown={onResize} /></div>;

/**
 * An event card that can be:
 * 1. Dragged to move to a different time slot
 * 2. Resized by dragging the bottom edge
 *
 * This is where the "puzzle piece" feel comes from - events snap to the grid
 * and give visual feedback during manipulation.
 */
export function DraggableEvent({ event, style }) {
    const { editEvent } = useEventActions();
    const eventRef = useRef(null);
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    const { isResizing, resizePreview, handleResizeStart } = useEventResize(event, eventRef, editEvent);
    const finalStyle = { ...(resizePreview ? { ...style, height: `${resizePreview}px` } : style), borderLeftColor: event.tag_details?.color || '#8B7355' };
    return <EventView eventRef={eventRef} className={getEventClassName(isDragging, isResizing)} style={finalStyle} dragProps={dragProps} event={event} onResize={handleResizeStart} />;
}

// Saves the new duration after resizing
function commitResize(event, deltaY, editEvent) {
    const deltaMinutes = pixelsToMinutes(deltaY);
    const currentEnd = new Date(event.end_time);
    const newEnd = new Date(currentEnd);
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);

    // Don't let it shrink past the start time
    const start = new Date(event.start_time);
    if (newEnd > start) {
        editEvent(event.id, { end_time: newEnd.toISOString() });
    }
}

function getEventClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}