/*
 * Attendance list section shell.
 */

import styles from "./AttendanceList.module.css";

export default function AttendanceListSection({ hint, footer, children }) {
  return (
    <section className={styles.recordSection}>
      <p className={styles.recordHint}>{hint}</p>
      {children}
      <AttendanceListFooter footer={footer} />
    </section>
  );
}

function AttendanceListFooter({ footer }) {
  if (!footer) return null;
  return <p className={styles.recordHint}>{footer}</p>;
}
