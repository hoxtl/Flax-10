/*
 * Attendance percent line.
 */

import styles from "./AttendanceCharts.module.css";

export default function AttendancePercentLine({ children, hidden = false }) {
  return <p className={styles.percentLine} style={hidden ? { visibility: "hidden" } : undefined}>{children}</p>;
}
