/*
 * Attendance records hook.
 */

import { getAttendanceRecords } from "../../../api/social/attendanceApi";
import { buildRecordsByEventId } from "../utils/attendanceRecords";
import { useAttendanceResource } from "./useAttendanceResource";

export function useAttendanceRecords() {
  const { data, refetch } = useAttendanceResource(loadAttendanceRecords, []);
  return { records: data, recordsByEventId: buildRecordsByEventId(data), refetch };
}

async function loadAttendanceRecords() {
  const data = await getAttendanceRecords();
  return Array.isArray(data) ? data : [];
}
