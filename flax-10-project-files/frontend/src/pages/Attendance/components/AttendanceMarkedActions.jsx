/*
 * Attendance marked-state actions — status badge only, no change allowed.
 */

import styles from "./AttendanceList.module.css";

export default function AttendanceMarkedActions({ event }) {
  return (
    <span className={styles.eventActions}>
      <AttendanceStatusBadge attended={event.attended} />
    </span>
  );
}

function AttendanceStatusBadge({ attended }) {
  const className = attended ? styles.badgeAttended : styles.badgeMissed;
  return <span className={className}>{attended ? "Attended" : "Missed"}</span>;
}
