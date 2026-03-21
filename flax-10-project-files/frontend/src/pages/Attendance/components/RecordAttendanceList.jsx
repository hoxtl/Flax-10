/*
 * Unmarked attendance list.
<<<<<<< HEAD
 * Shows lecture-type events only (lectures, LGTs, seminars, SmG).
 * Plays a tick/cross overlay flash after marking.
 */

import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { recordAttendance } from "../../../api/attendanceApi";
import AttendanceEventList from "./AttendanceEventList";
import AttendanceListSection from "./AttendanceListSection";
import AttendanceRecordActions from "./AttendanceRecordActions";
import AttendanceSuccessOverlay from "./AttendanceSuccessOverlay";

const MAX_RECORD_EVENTS = 20;

/** Prefixes whose events should appear in the record list (attendance-relevant). */

const ATTENDANCE_PREFIXES = ["lecture", "lgt", "smg", "seminar", "tutorial", "lab", "workshop", "practical"];

function isAttendanceEvent(event) {
  const title = (event.title || "").toLowerCase();
  if (event.event_type && event.event_type.toLowerCase() === "coursework") return false;
  return ATTENDANCE_PREFIXES.some((prefix) => title.startsWith(prefix));
}

function useRecordAttendanceState(onRecorded) {
  const [submittingId, setSubmittingId] = useState(null);
  const [successState, setSuccessState] = useState(null);
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const showSuccess = (attended) => {
    setSuccessState({ attended });
    timerRef.current = setTimeout(() => setSuccessState(null), 1500);
  };
  const onRecord = (eventId, attended) => submitAttendanceRecord(eventId, attended, setSubmittingId, onRecorded, showSuccess);
  return { submittingId, successState, onRecord };
}

function RecordAttendanceContent({ filteredEvents, submittingId, onRecord }) {
  return (
    <AttendanceListSection hint="Mark past lectures and seminars as attended or missed. Future events are locked." footer={filteredEvents.length > MAX_RECORD_EVENTS ? "Showing first 20 events." : ""}>
      <AttendanceEventList events={filteredEvents.slice(0, MAX_RECORD_EVENTS)} renderActions={(event) => <AttendanceRecordActions event={event} submittingId={submittingId} onRecord={onRecord} />} />
=======
 */

import { useState } from "react";
import { recordAttendance } from "../../../api/attendanceApi";
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </AttendanceListSection>
  );
}

<<<<<<< HEAD
export default function RecordAttendanceList({ events, onRecorded }) {
  const { submittingId, successState, onRecord } = useRecordAttendanceState(onRecorded);
  const filteredEvents = events.filter(isAttendanceEvent);
  if (!filteredEvents.length) return null;
  return (
    <>
      <RecordAttendanceContent filteredEvents={filteredEvents} submittingId={submittingId} onRecord={onRecord} />
      <AnimatePresence>{successState && <AttendanceSuccessOverlay key="success-overlay" attended={successState.attended} />}</AnimatePresence>
    </>
  );
}

async function submitAttendanceRecord(eventId, attended, setSubmittingId, onRecorded, showSuccess) {
  setSubmittingId(eventId);
  try {
    await recordAttendance(eventId, attended);
    showSuccess(attended);
=======
function buildRecordFooter(total) {
  return total > MAX_RECORD_EVENTS ? "Showing first 20 events. Use the prompt during class for more." : "";
}

async function submitAttendanceRecord(eventId, attended, setSubmittingId, onRecorded) {
  setSubmittingId(eventId);
  try {
    await recordAttendance(eventId, attended);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    onRecorded?.();
  } catch {
    return null;
  } finally {
    setSubmittingId(null);
  }
}
