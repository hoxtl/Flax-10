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
