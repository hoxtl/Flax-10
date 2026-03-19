/*
 * Attendance timetable helpers.
 */

export function isTimetableEvent(event) {
  return Boolean(event?.source && event?.external_id);
}

export function buildTimetableDateRange() {
  const start = shiftDate(-14);
  const end = shiftDate(30);
  return { start: start.toISOString(), end: end.toISOString() };
}

function shiftDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}
