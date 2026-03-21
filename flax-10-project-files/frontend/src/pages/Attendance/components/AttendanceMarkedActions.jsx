/*
<<<<<<< HEAD
 * Attendance marked-state actions — status badge only, no change allowed.
=======
 * Attendance marked-state actions.
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
 */

import styles from "./AttendanceList.module.css";

<<<<<<< HEAD
export default function AttendanceMarkedActions({ event }) {
  return (
    <span className={styles.eventActions}>
      <AttendanceStatusBadge attended={event.attended} />
=======
export default function AttendanceMarkedActions({ event, submittingId, onChange }) {
  return (
    <span className={styles.eventActions}>
      <AttendanceStatusBadge attended={event.attended} />
      <button type="button" className={styles.btnChange} onClick={() => onChange(event.id, !event.attended)} disabled={submittingId === event.id} title={event.attended ? "Mark as missed" : "Mark as attended"}>Change</button>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </span>
  );
}

function AttendanceStatusBadge({ attended }) {
  const className = attended ? styles.badgeAttended : styles.badgeMissed;
  return <span className={className}>{attended ? "Attended" : "Missed"}</span>;
}
