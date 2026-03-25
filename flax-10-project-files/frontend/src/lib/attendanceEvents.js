/*
 * Shared attendance refresh event helpers.
 */

export const ATTENDANCE_UPDATED_EVENT = "attendance-recorded";

export function dispatchAttendanceUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
}
