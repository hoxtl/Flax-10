/*
 * Attendance widget helpers.
 */

import { buildMarkedEventsFromRecords } from "../../../../attendance/utils/attendanceRecords";
import { buildSegmentEvents } from "../../../../attendance/utils/attendanceSegments";
import { computeAttendancePct } from "../../../../attendance/utils/attendanceSummary";

export function buildMarkedEvents(records) {
  return buildMarkedEventsFromRecords(records);
}

export { buildSegmentEvents, computeAttendancePct };
