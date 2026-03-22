/*
 * Unmarked attendance list.
 */

import { useState } from "react";
import { recordAttendance } from "../../../api/social/attendanceApi";
import AttendanceEventList from "./AttendanceEventList";
import AttendanceListSection from "./AttendanceListSection";
import AttendanceRecordActions from "./AttendanceRecordActions";

const MAX_RECORD_EVENTS = 20;

export default function RecordAttendanceList({ events, onRecorded }) {
  const [submittingId, setSubmittingId] = useState(null);
  return <RecordAttendanceContent events={events} onRecorded={onRecorded} submittingId={submittingId} setSubmittingId={setSubmittingId} />;
}

function RecordAttendanceContent({ events, onRecorded, submittingId, setSubmittingId }) {
  if (!events.length) return null;
  return (
    <AttendanceListSection hint="Mark attendance for your timetable events to update the charts above." footer={buildRecordFooter(events.length)}>
      <AttendanceEventList events={events.slice(0, MAX_RECORD_EVENTS)} renderActions={(event) => <AttendanceRecordActions event={event} submittingId={submittingId} onRecord={(eventId, attended) => submitAttendanceRecord(eventId, attended, setSubmittingId, onRecorded)} />} />
    </AttendanceListSection>
  );
}

function buildRecordFooter(total) {
  return total > MAX_RECORD_EVENTS ? "Showing first 20 events. Use the prompt during class for more." : "";
}

async function submitAttendanceRecord(eventId, attended, setSubmittingId, onRecorded) {
  setSubmittingId(eventId);
  try {
    await recordAttendance(eventId, attended);
    onRecorded?.();
  } catch {
    return null;
  } finally {
    setSubmittingId(null);
  }
}
