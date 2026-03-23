/**
 * calendarConstants - Grid layout constants and pixel/time conversion utilities.
 * Configures slot height, snap intervals, and provides position calculations.
 */

export const SLOT_HEIGHT = 60;
export const SNAP_INTERVAL = 15; // Minutes to snap to (15 = quarter hours)
export const MIN_EVENT_DURATION = 15; // Minimum event length in minutes

// How many pixels = one snap interval
export const PIXELS_PER_SNAP = SLOT_HEIGHT * (SNAP_INTERVAL / 60);

/**
 * Converts a Y pixel position to minutes from midnight.
 * Used when dropping/resizing events to figure out what time they clicked.
 */

export function pixelsToMinutes(pixels) {
    const rawMinutes = (pixels / SLOT_HEIGHT) * 60;
    // Snap down to interval (e.g., 15 min)
    return Math.floor(rawMinutes / SNAP_INTERVAL) * SNAP_INTERVAL;
}

/**
 * Converts minutes from midnight to Y pixel position.
 * Used to position events on the grid.
 */

export function minutesToPixels(minutes) {
    return (minutes / 60) * SLOT_HEIGHT;
}

/**
 * Gets the minute offset within a slot from a mouse Y position.
 * Returns 0-59 based on where in the slot you clicked.
 */

export function getMinuteOffset(mouseY, slotTop) {
    const offsetInSlot = mouseY - slotTop;
    const minuteOffset = (offsetInSlot / SLOT_HEIGHT) * 60;
    return Math.floor(minuteOffset / SNAP_INTERVAL) * SNAP_INTERVAL;
}