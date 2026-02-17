export function extractBaseEventId(id) {
    return id >= 10000 ? Math.floor(id / 10000) : id;
}

export function hasRecurrence(event) {
    return event?.recurrence_details || event?.recurrence_rule;
}
