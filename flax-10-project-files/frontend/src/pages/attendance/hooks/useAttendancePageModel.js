/*
 * Attendance page state and view model hook.
 */

import { useState } from "react";
import { useAttendanceRecords } from "./useAttendanceRecords";
import { useAttendanceStats } from "./useAttendanceStats";
import { useTimetableEvents } from "./useTimetableEvents";
import { buildAttendancePageModel } from "../utils/attendancePageModel";

export function useAttendancePageModel() {
  const [listTab, setListTab] = useState("record");
  const [selectedSegment, setSelectedSegment] = useState(null);
  return buildAttendancePageModel({ listTab, setListTab, selectedSegment, setSelectedSegment }, useAttendanceStats(), useAttendanceRecords(), useTimetableEvents());
}
