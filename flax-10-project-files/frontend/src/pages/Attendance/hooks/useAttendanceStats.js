/*
 * Attendance stats hook.
 */

import { getAttendanceStats } from "../../../api/social/attendanceApi";
import { useAttendanceResource } from "./useAttendanceResource";

export function useAttendanceStats() {
  const { data, loading, error, refetch } = useAttendanceResource(getAttendanceStats, null);
  return { stats: data, loading, error, refetch };
}
