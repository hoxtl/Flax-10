/*
 * Attendance record action buttons.
 */

import styles from "./AttendanceList.module.css";

export default function AttendanceRecordActions({ event, submittingId, onRecord }) {
  return (
    <span className={styles.eventActions}>
      <AttendanceActionButton activeClassName={styles.btnAttended} disabled={submittingId === event.id} onClick={() => onRecord(event.id, true)}>Attended</AttendanceActionButton>
      <AttendanceActionButton activeClassName={styles.btnMissed} disabled={submittingId === event.id} onClick={() => onRecord(event.id, false)}>Missed</AttendanceActionButton>
    </span>
  );
}

function AttendanceActionButton({ activeClassName, disabled, onClick, children }) {
  return <button type="button" className={activeClassName} onClick={onClick} disabled={disabled}>{children}</button>;
}
