/*
 * Marked attendance list.
 */

import { useState } from "react";
import { recordAttendance } from "../../../api/social/attendanceApi";
import AttendanceEventList from "./AttendanceEventList";
import AttendanceListSection from "./AttendanceListSection";
import AttendanceMarkedActions from "./AttendanceMarkedActions";

const MAX_MARKED_EVENTS = 30;

export default function MarkedAttendanceList({ markedEvents, onRecorded }) {
  const [submittingId, setSubmittingId] = useState(null);
  return <MarkedAttendanceContent markedEvents={markedEvents} onRecorded={onRecorded} submittingId={submittingId} setSubmittingId={setSubmittingId} />;
}

function MarkedAttendanceContent({ markedEvents, onRecorded, submittingId, setSubmittingId }) {
  if (!markedEvents.length) return null;
  return (
    <AttendanceListSection hint="Events you've already marked. Click to change if you marked it wrong." footer={buildMarkedFooter(markedEvents.length)}>
      <AttendanceEventList events={markedEvents.slice(0, MAX_MARKED_EVENTS)} renderActions={(event) => <AttendanceMarkedActions event={event} submittingId={submittingId} onChange={(eventId, attended) => submitMarkedAttendanceChange(eventId, attended, setSubmittingId, onRecorded)} />} />
    </AttendanceListSection>
  );
}

function buildMarkedFooter(total) {
  return total > MAX_MARKED_EVENTS ? "Showing 30 most recent." : "";
}

async function submitMarkedAttendanceChange(eventId, attended, setSubmittingId, onRecorded) {
  setSubmittingId(eventId);
  try {
    await recordAttendance(eventId, attended);
    onRecorded?.();
  } finally {
    setSubmittingId(null);
  }
}
