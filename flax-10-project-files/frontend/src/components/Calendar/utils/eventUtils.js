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
