import { fetchApi } from "./client";

export async function getAttendanceStats() {
  return fetchApi("/attendance/stats/");
}

export async function getAttendanceRecords() {
  return fetchApi("/attendance/records/");
}

export async function recordAttendance(eventId, attended = true) {
  return fetchApi("/attendance/record/", {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, attended }),
  });
}
