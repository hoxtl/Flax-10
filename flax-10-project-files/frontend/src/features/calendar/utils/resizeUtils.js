/**
 * Utility functions for handling event resizing in the calendar.
 */

import { SLOT_HEIGHT, SNAP_INTERVAL } from "../components/Calendar/calendarConstants";

/**
 * Calculates the new height of the event based on the mouse position.
 * @param {number} originalHeight - The original height of the event.
 * @param {number} currentY - The current Y position of the mouse.
 * @param {number} startY - The starting Y position of the mouse.
 * @returns {number} The new height of the event.
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
 * @param {object} event - The event being resized.
 * @param {number} pixelDiff - The difference in pixels between the start and end of the resize.
 * @param {function} editEvent - Function to save the new event duration.
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
 * @param {number} startY - The starting Y position of the mouse.
 * @param {number} originalHeight - The original height of the event.
 * @param {object} callbacks - An object containing onMove and onEnd callbacks.
 * @param {function} callbacks.onMove - Callback function for mouse move events.
 * @param {function} callbacks.onEnd - Callback function for mouse up events.
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