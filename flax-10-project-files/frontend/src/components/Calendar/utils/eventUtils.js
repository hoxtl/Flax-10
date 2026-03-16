/**
 * eventUtils - Event type detection, filtering, and transformation utilities.
 * Handles recurring event IDs, read-only detection, and view-based filtering.
 */
import { overlapsDay } from './dateUtils';

/** Extracts the base event ID from a recurring event instance ID. */
export function extractBaseEventId(id, event = null) {
    if (event?._baseId !== undefined) return event._baseId;
    if (typeof id === 'string' && id.includes('_')) {
        const base = id.split('_')[0];
        return /^\d+$/.test(base) ? parseInt(base, 10) : base;
    }

    if (typeof id === 'number' && id >= 1000000) {
        return Math.floor(id / 10000);
    }

    return id;
}

/** Checks if an event has recurrence configuration. */
export function hasRecurrence(event) {
    if (!event) return false;
    const hasDetails = !!event.recurrence_details;
    const hasRule = !!event.recurrence_rule;
    const hasString = typeof event.recurrence === 'string' && event.recurrence !== 'none';
    return hasDetails || hasRule || hasString;
}

/** Returns true if the event cannot be edited (module, society, or timetable). */
export function isReadOnlyEvent(event) {
    return getEventType(event) !== 'personal';
}

/** Returns the event source type: 'personal', 'society', 'module', or 'timetable'. */
export function getEventType(event) {
    if (!event) return 'personal';
    if (event.source === 'society') return 'society';
    if (event.module) return 'module';
    if (event.source && event.external_id) return 'timetable';
    return 'personal';
}

/**
 * Returns the effective tag identifier for an event, used for filtering and style resolution.
 * Prioritizes 'societies' for society events, then explicit tag names, falling back to 'other'.
 */
export function getEffectiveTagName(event) {
    if (!event) return 'other';
    if (event.source === 'society') return 'societies';

    const tagName = event.tag_name || (typeof event.tag === 'object' ? event.tag?.name : null);
    if (!tagName) return 'other';

    return tagName.toLowerCase();
}

function filterMonthEvents(events, selectedDate) {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return events.filter(e => new Date(e.start_time) < end && new Date(e.end_time) >= start);
}

function filterWeekEvents(events, selectedDate) {
    const d = new Date(selectedDate);
    const start = new Date(d); start.setDate(d.getDate() - d.getDay()); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return events.filter(e => new Date(e.start_time) < end && new Date(e.end_time) > start);
}

/** Filters events to those visible in the current view's date range. */
export function getVisibleEventsInView(events, selectedDate, viewMode) {
    if (!events?.length) return [];
    if (viewMode === 'month') return filterMonthEvents(events, selectedDate);
    if (viewMode === 'day') return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate));
    if (viewMode === 'week') return filterWeekEvents(events, selectedDate);
    return events;
}

/** Sorts events by start time in ascending order. */
export function sortByStartTime(events) {
    return [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

/** Returns true if the event spans a full day (midnight to midnight). */
export function isAllDay(event) {
    if (event.all_day || event.is_all_day) return true;
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const endMidnight = end.getHours() === 0 && end.getMinutes() === 0;
    const nextDay = end.getDate() !== start.getDate() || end.getMonth() !== start.getMonth();
    return startMidnight && endMidnight && nextDay;
}