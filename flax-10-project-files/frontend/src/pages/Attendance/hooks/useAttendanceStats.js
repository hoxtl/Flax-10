import { useEffect, useState, useCallback } from "react";
import { getAttendanceStats } from "../../../api/attendanceApi";

/** Single responsibility: fetch attendance stats and expose state. */
export function useAttendanceStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      const data = await getAttendanceStats();
      setStats(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAttendanceStats();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error, refetch };
}
