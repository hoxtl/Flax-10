/*
 * Timetable attendance events hook.
 */

import { getEvents } from "../../../api/calendar/eventApi";
import { buildTimetableDateRange, isTimetableEvent } from "../utils/attendanceTimetable";
import { useAttendanceResource } from "./useAttendanceResource";

export function useTimetableEvents() {
  const { data, loading, refetch } = useAttendanceResource(loadTimetableEvents, []);
  return { events: data, loading, refetch };
}

async function loadTimetableEvents() {
  const data = await getEvents(buildTimetableDateRange());
  return Array.isArray(data) ? data.filter(isTimetableEvent) : [];
}
