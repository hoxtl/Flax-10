/*
 * Attendance widget helpers.
 */

<<<<<<< HEAD
import { buildMarkedEventsFromRecords } from "../../../../attendance/utils/attendanceRecords";
import { buildSegmentEvents } from "../../../../attendance/utils/attendanceSegments";
import { computeAttendancePct } from "../../../../attendance/utils/attendanceSummary";
=======
import { buildMarkedEventsFromRecords } from "../../../../Attendance/utils/attendanceRecords";
import { buildSegmentEvents } from "../../../../Attendance/utils/attendanceSegments";
import { computeAttendancePct } from "../../../../Attendance/utils/attendanceSummary";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function buildMarkedEvents(records) {
  return buildMarkedEventsFromRecords(records);
}

export { buildSegmentEvents, computeAttendancePct };
