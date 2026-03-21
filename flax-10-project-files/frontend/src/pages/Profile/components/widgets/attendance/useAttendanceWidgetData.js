import { useMemo } from "react";
<<<<<<< HEAD
import { useAttendanceRecords } from "../../../../attendance/hooks/useAttendanceRecords";
import { useAttendanceStats } from "../../../../attendance/hooks/useAttendanceStats";
=======
import { useAttendanceRecords } from "../../../../Attendance/hooks/useAttendanceRecords";
import { useAttendanceStats } from "../../../../Attendance/hooks/useAttendanceStats";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import {
  buildByTypeChartData,
  buildOverallChartData,
  withByTypeColors,
<<<<<<< HEAD
} from "../../../../attendance/utils/attendanceChartData";
=======
} from "../../../../Attendance/utils/attendanceChartData";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { recordAttendance } from "../../../../../api/attendanceApi";
import {
  buildMarkedEvents,
  buildSegmentEvents,
  computeAttendancePct,
} from "./attendanceWidgetUtils";

function buildChartData(stats) {
  const overall = stats?.overall || { attended: 0, missed: 0 };
  const byType = stats?.by_type || {};
  return {
    overall,
    overallData: buildOverallChartData(overall),
    byTypeData: withByTypeColors(buildByTypeChartData(byType)),
  };
}

function useSegmentEvents(records, selectedSegment) {
  const markedEvents = useMemo(() => buildMarkedEvents(records), [records]);
  return useMemo(
    () => buildSegmentEvents(selectedSegment, markedEvents),
    [markedEvents, selectedSegment],
  );
}

function useAttendanceRefresh(refetchStats, refetchRecords) {
  return async (eventId, attended) => {
    await recordAttendance(eventId, attended);
    await refetchStats();
    await refetchRecords();
  };
}

export function useAttendanceWidgetData(selectedSegment) {
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { records, refetch: refetchRecords } = useAttendanceRecords();
  const { overall, overallData, byTypeData } = buildChartData(stats);
  const segmentEvents = useSegmentEvents(records, selectedSegment);
  const handleToggleStatus = useAttendanceRefresh(refetchStats, refetchRecords);
  return {
    stats, loading, error, overall, overallData, byTypeData,
    attendancePct: computeAttendancePct(overall),
    handleToggleStatus, segmentEvents,
  };
}
