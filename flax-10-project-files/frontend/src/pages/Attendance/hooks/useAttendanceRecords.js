import { useEffect, useState, useCallback } from "react";
import { getAttendanceRecords } from "../../../api/attendanceApi";

/** Single responsibility: fetch attendance records (event_id -> attended) and expose refetch. */
export function useAttendanceRecords() {
  const [records, setRecords] = useState([]);

  const refetch = useCallback(async () => {
    try {
      const data = await getAttendanceRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const recordsByEventId = new Map(records.map((r) => [r.event_id, r.attended]));
  return { recordsByEventId, refetch };
}
