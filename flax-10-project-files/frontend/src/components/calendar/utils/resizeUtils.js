/**
 * Utility functions for handling event resizing in the calendar.
 */

import { SLOT_HEIGHT, SNAP_INTERVAL, pixelsToMinutes } from "../calendarConstants";

/**
 * Calculates the new height of the event based on the mouse position.
 */

export const calculateNewHeight = (originalHeight, currentY, startY) => {
    const diff = currentY - startY;
    const rawHeight = originalHeight + diff;
    // Snap the height calculation
    const minutes = Math.round(((rawHeight / SLOT_HEIGHT) * 60) / SNAP_INTERVAL) * SNAP_INTERVAL;
    return Math.max(SLOT_HEIGHT * (SNAP_INTERVAL / 60), (minutes / 60) * SLOT_HEIGHT);
};

/**
 * Commits the resize operation by updating the event duration.
 */

export const commitResize = (event, pixelDiff, editEvent) => {
    // Reuse your pixelsToMinutes helper for consistency
    const minutesChange = pixelsToMinutes(pixelDiff);
    const newDuration = (event.duration || 60) + minutesChange;

    editEvent({
        ...event,
        duration: Math.max(SNAP_INTERVAL, newDuration),
    });
};

/**
 * Creates a resize session that listens for mouse move and mouse up events.
 * @param {number} startY - The clientY pixel position where the drag began.
 * @param {number} originalHeight - The element's height in pixels at drag start.
 * @param {{ onMove: (newHeight: number) => void, onEnd: (pixelDiff: number) => void }} callbacks
 *   onMove receives the clamped new height (min 30px); onEnd receives the total pixel delta.
 */

export const createResizeSession = (startY, originalHeight, { onMove, onEnd }) => {
    const onMouseMove = (e) => onMove(Math.max(30, originalHeight + (e.clientY - startY)));
    const onMouseUp = (e) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onEnd(e.clientY - startY);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};