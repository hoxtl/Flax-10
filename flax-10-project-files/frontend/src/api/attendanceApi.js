/*
 * Attendance API client.
 */

import { fetchApi } from "./client";

export function getAttendanceStats() {
  return fetchApi("/attendance/stats/");
}

export function getAttendanceRecords() {
  return fetchApi("/attendance/records/");
}

export function recordAttendance(eventId, attended = true) {
  return fetchApi("/attendance/record/", { method: "POST", body: JSON.stringify({ event_id: eventId, attended }) });
}
