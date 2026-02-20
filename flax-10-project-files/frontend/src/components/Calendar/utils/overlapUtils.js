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
    return confirm(`This event overlaps with: ${names}\\n\\nDo you want to continue?`);
}

function processGroup(groupEvents, columnsMap) {
    const columnEnds = [];
    const groupResults = new Map();

    groupEvents.forEach(event => {
        const col = findAvailableColumn(event, columnEnds);
        groupResults.set(event.id, { column: col });
        columnEnds[col] = new Date(event.end_time);
    });

    assignTotalColumns(groupResults, columnEnds.length, columnsMap);
}

function findAvailableColumn(event, columnEnds) {
    const start = new Date(event.start_time);
    const col = columnEnds.findIndex(end => end <= start);
    return col === -1 ? columnEnds.length : col;
}

function assignTotalColumns(groupResults, totalColumns, columnsMap) {
    groupResults.forEach((val, id) => {
        columnsMap.set(id, { column: val.column, totalColumns });
    });
}

export function calculateEventColumns(events) {
    if (!events.length) return new Map();
    const sorted = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return processEventGroups(sorted);
}

function processEventGroups(sortedEvents) {
    const ctx = { columns: new Map(), group: [], end: null };
    sortedEvents.forEach(event => processEventInContext(event, ctx));
    if (ctx.group.length) processGroup(ctx.group, ctx.columns);
    return ctx.columns;
}

function processEventInContext(event, ctx) {
    if (shouldStartNewGroup(event, ctx.end)) {
        processGroup(ctx.group, ctx.columns);
        ctx.group = [];
        ctx.end = null;
    }
    ctx.group.push(event);
    ctx.end = updateGroupEnd(event, ctx.end);
}

function shouldStartNewGroup(event, groupEnd) {
    const start = new Date(event.start_time);
    return groupEnd && start >= groupEnd;
}

function updateGroupEnd(event, currentGroupEnd) {
    const end = new Date(event.end_time);
    return !currentGroupEnd || end > currentGroupEnd ? end : currentGroupEnd;
}
