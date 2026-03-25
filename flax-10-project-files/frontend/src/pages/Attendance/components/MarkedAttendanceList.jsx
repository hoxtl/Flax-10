/*
 * Marked attendance list — read-only, grouped by date.
 */

import AttendanceEventList from "./AttendanceEventList";
import AttendanceListSection from "./AttendanceListSection";
import AttendanceMarkedActions from "./AttendanceMarkedActions";

const MAX_MARKED_EVENTS = 30;

export default function MarkedAttendanceList({ markedEvents }) {
  if (!markedEvents.length) return null;
  return (
    <AttendanceListSection
      hint="Your recorded attendance. Once marked, attendance cannot be changed."
      footer={markedEvents.length > MAX_MARKED_EVENTS ? "Showing 30 most recent." : ""}
    >
      <AttendanceEventList
        events={markedEvents.slice(0, MAX_MARKED_EVENTS)}
        renderActions={(event) => <AttendanceMarkedActions event={event} />}
      />
    </AttendanceListSection>
  );
}
