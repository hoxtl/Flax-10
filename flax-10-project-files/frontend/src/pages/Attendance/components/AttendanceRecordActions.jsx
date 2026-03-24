/*
 * Attendance record action buttons.
 * Future events show a Ban icon with a Tooltip; past events show normal Attended/Missed buttons.
 */

import { Ban } from "lucide-react";
import Tooltip from "../../../components/Common/Tooltip/Tooltip";
import { isEventInPast } from "../utils/attendanceEventDate";
import styles from "./AttendanceList.module.css";

const FUTURE_TOOLTIP = "Lecture hasn't started yet — you can mark attendance once it begins";

export default function AttendanceRecordActions({ event, submittingId, onRecord }) {
  const isPast = isEventInPast(event.start_time);
  const isSubmitting = submittingId === event.id;

  if (!isPast) {
    return (
      <Tooltip content={FUTURE_TOOLTIP} position="top">
        <span className={styles.eventActions}>
          <button type="button" className={`${styles.btnAttended} ${styles.btnFuture}`} disabled aria-label="Cannot mark future event">
            <Ban size={12} strokeWidth={2.2} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Attended
          </button>
          <button type="button" className={`${styles.btnMissed} ${styles.btnFuture}`} disabled aria-label="Cannot mark future event">
            <Ban size={12} strokeWidth={2.2} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Missed
          </button>
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={styles.eventActions}>
      <button type="button" className={styles.btnAttended} disabled={isSubmitting} onClick={() => onRecord(event.id, true)}>
        Attended
      </button>
      <button type="button" className={styles.btnMissed} disabled={isSubmitting} onClick={() => onRecord(event.id, false)}>
        Missed
      </button>
    </span>
  );
}
