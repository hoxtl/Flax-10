export function extractBaseEventId(id) {
    return id >= 10000 ? Math.floor(id / 10000) : id;
}

export function hasRecurrence(event) {
    return event?.recurrence_details || event?.recurrence_rule;
}

export function isReadOnlyEvent(event) {
    return getEventType(event) !== 'personal';
}

export function getEventType(event) {
    if (!event) return 'personal';
    if (event.source === 'society') return 'society';
    if (event.module) return 'module';
    if (event.source && event.external_id) return 'timetable';
    return 'personal';
}
