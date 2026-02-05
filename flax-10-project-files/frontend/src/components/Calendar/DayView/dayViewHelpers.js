// Returns an array of hours [0, 1, 2, ... 23]
export function getHoursOfDay() {
    return Array.from({ length: 24 }, (_, i) => i);
}

// Converts 24-hour number to "9 AM" format
export function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

/**
 * Calculates the CSS style for positioning an event on the grid.
 * Returns top (position from midnight) and height (based on duration).
 */
export function calculateEventStyle(event, slotHeight) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes = (end - start) / (1000 * 60);

    const top = (startMinutes / 60) * slotHeight;
    const height = (durationMinutes / 60) * slotHeight;

    return { top: `${top}px`, height: `${height}px` };
}

/**
 * Calculates new end time based on resize delta.
 * Used when user drags the bottom edge of an event.
 */
export function calculateNewEndTime(event, deltaY, slotHeight, snapInterval) {
    const deltaMinutes = (deltaY / slotHeight) * 60;
    const snappedDelta = Math.round(deltaMinutes / snapInterval) * snapInterval;

    const currentEnd = new Date(event.end_time);
    const newEnd = new Date(currentEnd);
    newEnd.setMinutes(newEnd.getMinutes() + snappedDelta);

    // Don't let event become shorter than minimum
    const start = new Date(event.start_time);
    if (newEnd <= start) newEnd.setTime(start.getTime() + snapInterval * 60 * 1000);

    return newEnd;
}