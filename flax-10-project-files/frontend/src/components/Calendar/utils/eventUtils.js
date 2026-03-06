import { overlapsDay } from './dateUtils';

export function extractBaseEventId(id, event = null) {
    if (event?._baseId !== undefined) return event._baseId;
    if (typeof id === 'string' && id.includes('_')) {
        const base = id.split('_')[0];
        return /^\d+$/.test(base) ? parseInt(base, 10) : base;
    }

    // Some events (e.g. from backend or sync) use numeric padding for occurrences: baseId * 10000 + index.
    // We only divide if the ID is suspiciously large (e.g. > 1M) to avoid breaking real IDs like 40653.
    if (typeof id === 'number' && id >= 1000000) {
        return Math.floor(id / 10000);
    }

    return id;
}

export function hasRecurrence(event) {
    if (!event) return false;
    const hasDetails = !!event.recurrence_details;
    const hasRule = !!event.recurrence_rule;
    const hasString = typeof event.recurrence === 'string' && event.recurrence !== 'none';
    return hasDetails || hasRule || hasString;
}

export function isReadOnlyEvent(event) {
    return getEventType(event) !== 'personal';
}

export function getEventType(event) {
    if (!event) return 'personal';
    if (event.source === 'task') return 'task';
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

/**
 * Filters a list of events down to only those that overlap the current view's visible range.
 * This is used to ensure count labels and rendering are in sync.
 */
export function getVisibleEventsInView(events, selectedDate, viewMode) {
    if (!events?.length) return [];
    if (viewMode === 'month' || viewMode === 'year') return events;

    if (viewMode === 'day') {
        return events.filter(e => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate));
    }

    if (viewMode === 'week') {
        const d = new Date(selectedDate);
        const day = d.getDay();
        const start = new Date(d); start.setDate(d.getDate() - day); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(start.getDate() + 7);

        return events.filter(e => {
            const eStart = new Date(e.start_time);
            const eEnd = new Date(e.end_time);
            return eStart < end && eEnd > start;
        });
    }

    return events;
}
