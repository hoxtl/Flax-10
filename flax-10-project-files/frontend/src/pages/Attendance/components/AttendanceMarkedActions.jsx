/*
 * Attendance marked-state actions.
 */

import styles from "./AttendanceList.module.css";

export default function AttendanceMarkedActions({ event, submittingId, onChange }) {
  return (
    <span className={styles.eventActions}>
      <AttendanceStatusBadge attended={event.attended} />
      <button type="button" className={styles.btnChange} onClick={() => onChange(event.id, !event.attended)} disabled={submittingId === event.id} title={event.attended ? "Mark as missed" : "Mark as attended"}>Change</button>
    </span>
  );
}

function AttendanceStatusBadge({ attended }) {
  const className = attended ? styles.badgeAttended : styles.badgeMissed;
  return <span className={className}>{attended ? "Attended" : "Missed"}</span>;
}
