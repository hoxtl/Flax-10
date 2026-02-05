// Returns an array of hours from 0 to 23 for rendering the day grid
export function getHoursOfDay() {
    return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Converts hour number (0-23) to readable format like 9 AM or 2 PM
 * Handles the tricky cases: 0 = 12 AM, 12 = 12PM
 */
export function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

/**
 * Calculates where to position an event within its hour slot.
 * If event starts at 9:30, it should be offset 50% into the 9AM slot.
 * Returns pixels from top of the slot
 */
export function calculateEventPosition(event, slotHeight) {
    const start = new Date(event.start_time);
    const minutes = start.getMinutes();
    return (minutes / 60) * slotHeight;
}

/**
 * Calculates how tall to make an event card based on its duration
 * A 90-min event should be 1.5x the height of a 1-hour slot
 */
export function calculateEventHeight(event, slotHeight) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const durationMinutes = (end - start) / 60000; // convert ms to minutes
    return (durationMinutes / 60) * slotHeight;
}