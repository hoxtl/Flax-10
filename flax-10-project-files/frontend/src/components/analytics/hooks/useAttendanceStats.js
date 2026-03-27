/*
 * Attendance analytics data loader.
 */

import { useEffect, useState } from "react";

import { getAttendanceStats } from "../../../api/attendanceApi";

export default function useAttendanceStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttendanceStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
