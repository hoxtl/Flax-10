import { useState, useCallback } from 'react';
import { createResizeSession } from './resizeUtils';
import { SLOT_HEIGHT, MIN_EVENT_DURATION, pixelsToMinutes } from './calendarConstants';

/**
 * Hook for resizing calendar events by dragging the bottom edge.
 * Returns state and a handler to attach to the resize handle.
 *
 * @param {object} event - The event being resized
 * @param {ref} eventRef - Ref to the event DOM element
 * @param {function} editEvent - Function to save the new end time
 */
export function useEventResize(event, eventRef, editEvent) {
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null);
    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        setIsResizing(true);
        const onMove = (height) => setResizePreview(height);
        const onEnd = (diff) => {
            commitResize(event, diff, editEvent);
            setIsResizing(false);
            setResizePreview(null);
        };
        createResizeSession(e.clientY, eventRef.current.offsetHeight, { onMove, onEnd });
    }, [event, eventRef, editEvent]);
    return { isResizing, resizePreview, handleResizeStart };
}

/**
 * Calculates the preview height during resize.
 * Enforces minimum height based on MIN_EVENT_DURATION.
 */
function calculateNewHeight(originalHeight, currentY, startY) {
    const delta = currentY - startY;
    const minHeight = (MIN_EVENT_DURATION / 60) * SLOT_HEIGHT;
    return Math.max(minHeight, originalHeight + delta);
}

/**
 * Saves the new event duration after resize is complete.
 * Converts pixel delta to minutes and updates the event.
 */
function commitResize(event, deltaY, editEvent) {
    const deltaMinutes = pixelsToMinutes(deltaY);
    const currentEnd = new Date(event.end_time);
    const newEnd = new Date(currentEnd);
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);

    // Don't let event shrink past its start time
    const start = new Date(event.start_time);
    if (newEnd > start) {
        editEvent(event.id, { end_time: newEnd.toISOString() });
    }
}