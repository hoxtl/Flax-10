/*
 * Attendance widget helpers.
 */

import { buildMarkedEventsFromRecords } from "../../../../Attendance/utils/attendanceRecords";
import { buildSegmentEvents } from "../../../../Attendance/utils/attendanceSegments";
import { computeAttendancePct } from "../../../../Attendance/utils/attendanceSummary";

export function buildMarkedEvents(records) {
  return buildMarkedEventsFromRecords(records);
}

export { buildSegmentEvents, computeAttendancePct };
