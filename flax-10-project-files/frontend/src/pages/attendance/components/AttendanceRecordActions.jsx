/*
 * Attendance record action buttons.
 * Future events show a Ban icon with a Tooltip; past events show normal Attended/Missed buttons.
 */

import { Ban } from "lucide-react";
import Tooltip from "../../../components/common/tooltip/Tooltip";
import { isEventInPast } from "../utils/attendanceEventDate";
import styles from "./AttendanceList.module.css";

const FUTURE_TOOLTIP = "Lecture hasn't started yet — you can mark attendance once it begins";

const BAN_ICON_STYLE = { marginRight: "4px", verticalAlign: "middle" };

function FutureEventButtons() {
  return (
    <span className={styles.eventActions}>
      <button type="button" className={`${styles.btnAttended} ${styles.btnFuture}`} disabled aria-label="Cannot mark future event"><Ban size={12} strokeWidth={2.2} style={BAN_ICON_STYLE} />Attended</button>
      <button type="button" className={`${styles.btnMissed} ${styles.btnFuture}`} disabled aria-label="Cannot mark future event"><Ban size={12} strokeWidth={2.2} style={BAN_ICON_STYLE} />Missed</button>
    </span>
  );
}

function PastEventButtons({ eventId, isSubmitting, onRecord }) {
  return (
    <span className={styles.eventActions}>
      <button type="button" className={styles.btnAttended} disabled={isSubmitting} onClick={() => onRecord(eventId, true)}>Attended</button>
      <button type="button" className={styles.btnMissed} disabled={isSubmitting} onClick={() => onRecord(eventId, false)}>Missed</button>
    </span>
  );
}

export default function AttendanceRecordActions({ event, submittingId, onRecord }) {
  const isPast = isEventInPast(event.start_time);
  const isSubmitting = submittingId === event.id;
  if (!isPast) return <Tooltip content={FUTURE_TOOLTIP} position="top"><FutureEventButtons /></Tooltip>;
  return <PastEventButtons eventId={event.id} isSubmitting={isSubmitting} onRecord={onRecord} />;
}
