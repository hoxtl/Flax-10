/*
 * Attendance record derivation helpers.
 */

<<<<<<< HEAD
/** Ascending: upcoming / soonest-first (used for unrecorded events). */

function sortAscending(a, b) {
  return new Date(a.start_time) - new Date(b.start_time);
}

/** Descending: most-recent-first (used for already-marked events). */

function sortDescending(a, b) {
=======
function sortAttendanceEvents(a, b) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return new Date(b.start_time) - new Date(a.start_time);
}

function withAttendanceStatus(event, recordsByEventId) {
  return { ...event, attended: recordsByEventId.get(event.id) };
}

export function buildRecordsByEventId(records) {
  return new Map(records.map((record) => [record.event_id, record.attended]));
}

export function buildUnmarkedEvents(events, recordsByEventId) {
<<<<<<< HEAD
  return events.filter((event) => !recordsByEventId.has(event.id)).sort(sortAscending);
}

export function buildMarkedEvents(events, recordsByEventId) {
  return events.filter((event) => recordsByEventId.has(event.id)).map((event) => withAttendanceStatus(event, recordsByEventId)).sort(sortDescending);
}

export function buildMarkedEventsFromRecords(records) {
  return records.map((record) => ({ id: record.event_id, title: record.title || "Untitled Event", start_time: record.start_time, attended: record.attended, event_type: record.event_type })).sort(sortDescending);
=======
  return events.filter((event) => !recordsByEventId.has(event.id));
}

export function buildMarkedEvents(events, recordsByEventId) {
  return events.filter((event) => recordsByEventId.has(event.id)).map((event) => withAttendanceStatus(event, recordsByEventId)).sort(sortAttendanceEvents);
}

export function buildMarkedEventsFromRecords(records) {
  return records.map((record) => ({ id: record.event_id, title: record.title || "Untitled Event", start_time: record.start_time, attended: record.attended, event_type: record.event_type })).sort(sortAttendanceEvents);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
