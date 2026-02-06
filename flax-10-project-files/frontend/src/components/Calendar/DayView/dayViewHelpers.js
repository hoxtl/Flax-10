import { calculateEventColumns } from '../../../utils/overlapUtils';

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
 * Returns top (position from midnight), height (based on duration),
 * and width/left for side-by-side positioning if overlapping.
 */
export function calculateEventStyle(event, slotHeight, allEvents) {
    const start = new Date(event.start_time);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const duration = (new Date(event.end_time) - start) / (1000 * 60);

    const style = { top: `${(startMins / 60) * slotHeight}px`, height: `${(duration / 60) * slotHeight}px`, width: '100%', left: '0' };
    const colInfo = allEvents?.length > 1 ? calculateEventColumns(allEvents).get(event.id) : null;

    if (colInfo?.totalColumns > 1) {
        const width = 100 / colInfo.totalColumns;
        style.width = `${width}%`;
        style.left = `${width * colInfo.column}%`;
    }

    return style;
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