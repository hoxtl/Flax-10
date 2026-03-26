/*
 * Attendance chart legend shell.
 */

import styles from "./AttendanceCharts.module.css";

export default function AttendanceLegend({ children }) {
  return <div className={styles.legend}>{children}</div>;
}

export function AttendanceLegendStat({ className = "", children }) {
  return <span className={className}>{children}</span>;
}
