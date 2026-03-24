/*
 * Attendance event date formatter.
 */

const attendanceDateOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function formatAttendanceEventDate(startTime) {
  if (!startTime) return "";
  return new Date(startTime).toLocaleDateString(undefined, attendanceDateOptions);
}

export function formatAttendanceDetailDate(startTime) {
  if (!startTime) return "";
  return new Date(startTime).toLocaleDateString("en-GB", attendanceDateOptions);
}

/** "Monday, 30 March" — used as the date group header in attendance lists. */
export function formatDateGroupHeader(startTime) {
  if (!startTime) return "Unknown date";
  return new Date(startTime).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "HH:MM" time only — used inside a date-grouped row. */
export function formatEventTime(startTime) {
  if (!startTime) return "";
  return new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** True if the event's start time is in the past (or right now). */
export function isEventInPast(startTime) {
  if (!startTime) return false;
  return new Date(startTime) <= new Date();
}
