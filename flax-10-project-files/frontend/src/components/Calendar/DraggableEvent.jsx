import { useState, useCallback, useRef } from 'react';
import { useDrag } from '../../hooks/useDragDrop';
import { useEventActions } from '../../hooks/useCalendarEvents';
import { useEventResize } from './useEventResize';
import { formatTime } from '../../utils/dateUtils';
import './DraggableEvent.css';

/**
 * A draggable, resizable event card.
 * Drag to move, drag bottom edge to resize.
 */
export function DraggableEvent({ event, style }) {
    const { editEvent } = useEventActions();
    const eventRef = useRef(null);
    // Hook for drag-to-move functionality
    const { dragProps, isDragging } = useDrag({ type: 'EVENT', data: event });
    // Hook for resize functionality
    const { isResizing, resizePreview, handleResizeStart } = useEventResize(event, eventRef, editEvent);
    // Build the final style, including resize preview if active
    const finalStyle = buildEventStyle(style, resizePreview, event);
    const className = buildClassName(isDragging, isResizing);
    return (
        <div ref={eventRef} className={className} style={finalStyle} {...dragProps}>
            <EventContent event={event} />
            <div className="resize-handle" onMouseDown={handleResizeStart} />
        </div>
    );
}

/**
 * The inner content of an event card.
 * Shows title and time range.
 */
function EventContent({ event }) {
    const startTime = formatTime(new Date(event.start_time));
    const endTime = formatTime(new Date(event.end_time));

    return (
        <div className="event-content">
            <div className="event-title">{event.title}</div>
            <div className="event-time">{startTime} - {endTime}</div>
        </div>
    );
}

/**
 * Builds the final style object for the event.
 * Includes resize preview height and tag color.
 */
function buildEventStyle(baseStyle, resizePreview, event) {
    const style = { ...baseStyle };

    if (resizePreview) {
        style.height = `${resizePreview}px`;
    }

    // Color the left border based on the event's tag
    style.borderLeftColor = event.tag_details?.color || '#8B7355';

    return style;
}

/**
 * Builds the CSS class string based on drag/resize state.
 */
function buildClassName(isDragging, isResizing) {
    let className = 'draggable-event';
    if (isDragging) className += ' dragging';
    if (isResizing) className += ' resizing';
    return className;
}