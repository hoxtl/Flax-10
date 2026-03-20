/*
 * Attendance record derivation helpers.
 */

function sortAttendanceEvents(a, b) {
  return new Date(b.start_time) - new Date(a.start_time);
}

function withAttendanceStatus(event, recordsByEventId) {
  return { ...event, attended: recordsByEventId.get(event.id) };
}

export function buildRecordsByEventId(records) {
  return new Map(records.map((record) => [record.event_id, record.attended]));
}

export function buildUnmarkedEvents(events, recordsByEventId) {
  return events.filter((event) => !recordsByEventId.has(event.id));
}

export function buildMarkedEvents(events, recordsByEventId) {
  return events.filter((event) => recordsByEventId.has(event.id)).map((event) => withAttendanceStatus(event, recordsByEventId)).sort(sortAttendanceEvents);
}

export function buildMarkedEventsFromRecords(records) {
  return records.map((record) => ({ id: record.event_id, title: record.title || "Untitled Event", start_time: record.start_time, attended: record.attended, event_type: record.event_type })).sort(sortAttendanceEvents);
}
