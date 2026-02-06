/*
    Utilities for detecting event overlaps and calculating side-by-side layout.
*/

export function eventsOverlap(event1, event2) {
    if (event1.id === event2.id) return false;
    const start1 = new Date(event1.start_time);
    const end1 = new Date(event1.end_time);
    const start2 = new Date(event2.start_time);
    const end2 = new Date(event2.end_time);
    return start1 < end2 && start2 < end1;
}

export function findOverlappingEvents(event, allEvents) {
    return allEvents.filter(e => eventsOverlap(event, e));
}

export function checkOverlapWithConfirm(event, allEvents) {
    const overlapping = findOverlappingEvents(event, allEvents);
    if (overlapping.length === 0) return true;

    const names = overlapping.map(e => e.title).join(', ');
    return confirm(`This event overlaps with: ${names}\n\nDo you want to continue?`);
}

export function calculateEventColumns(events) {
    if (!events.length) return new Map();

    const sorted = [...events].sort((a, b) =>
        new Date(a.start_time) - new Date(b.start_time)
    );

    const columns = new Map();
    const columnEnds = [];

    sorted.forEach(event => {
        const start = new Date(event.start_time);
        let col = columnEnds.findIndex(end => end <= start);
        if (col === -1) col = columnEnds.length;

        columns.set(event.id, { column: col, totalColumns: 0 });
        columnEnds[col] = new Date(event.end_time);
    });

    const maxCols = columnEnds.length;
    columns.forEach(val => val.totalColumns = maxCols);

    return columns;
}
