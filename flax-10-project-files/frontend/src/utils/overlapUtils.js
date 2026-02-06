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

// function that processes a group of overlapping events to determine their columns
function processGroup(groupEvents, columnsMap) {
    const columnEnds = [];
    // We use a temporary map so we can set the totalColumns after processing the whole group
    const groupResults = new Map();

    groupEvents.forEach(event => {
        const start = new Date(event.start_time);
        // Find the first column where the previous event has ended by this event's start time
        let col = columnEnds.findIndex(end => end <= start);

        // If no column is free, start a new one
        if (col === -1) col = columnEnds.length;

        groupResults.set(event.id, { column: col });
        columnEnds[col] = new Date(event.end_time);
    });

    const maxCols = columnEnds.length;
    groupResults.forEach((val, id) => {
        columnsMap.set(id, { column: val.column, totalColumns: maxCols });
    });
}

export function calculateEventColumns(events) {
    if (!events.length) return new Map();

    // Sort events by start time
    const sorted = [...events].sort((a, b) =>
        new Date(a.start_time) - new Date(b.start_time)
    );

    const columns = new Map();
    let currentGroup = [];
    let groupEnd = null;

    sorted.forEach(event => {
        const start = new Date(event.start_time);

        // If we have a current group and this event starts after the entire group has finished,
        // then this event belongs to a new, non-overlapping group.
        if (groupEnd && start >= groupEnd) {
            processGroup(currentGroup, columns);
            currentGroup = [];
            groupEnd = null;
        }

        currentGroup.push(event);

        // Update the end time of the current group (it's the max end time of all events in the group)
        const end = new Date(event.end_time);
        if (!groupEnd || end > groupEnd) {
            groupEnd = end;
        }
    });

    // Don't forget to process the last group
    if (currentGroup.length > 0) {
        processGroup(currentGroup, columns);
    }

    return columns;
}
