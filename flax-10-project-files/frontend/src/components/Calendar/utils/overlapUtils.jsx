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

export async function checkOverlapWithConfirm(event, allEvents, confirmFn) {
    const overlapping = findOverlappingEvents(event, allEvents);
    if (overlapping.length === 0) return true;
    const overlapListStyle = { paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '0.9em', color: 'var(--text)' };
    const message = (
        <div>
            <p style={{ margin: '0 0 10px 0' }}>This overlaps with existing events:</p>
            <ul style={overlapListStyle}>{overlapping.map(e => <li key={e.id}><strong>{e.title}</strong></li>)}</ul>
            <p style={{ margin: 0 }}>Do you want to save it anyway?</p>
        </div>
    );
    return await confirmFn({ title: "Scheduling Conflict", message, confirmText: "Save Anyway" });
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
    processGroup(ctx.group, ctx.columns);
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
