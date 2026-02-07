export function extractBaseEventId(id) {
    return id > 1000000 ? Math.floor(id / 1000000) : id;
}

export function hasRecurrence(event) {
    return event?.recurrence_details || event?.recurrence_rule;
}
