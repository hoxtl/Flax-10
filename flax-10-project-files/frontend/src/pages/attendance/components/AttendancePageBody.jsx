/*
 * Attendance page content layout.
 */

import AttendanceChartsColumn from "./AttendanceChartsColumn";
import AttendanceListColumn from "./AttendanceListColumn";
import AttendanceSummaryBar from "./AttendanceSummaryBar";
import styles from "../AttendancePage.module.css";

export default function AttendancePageBody({ model }) {
  return (
    <>
      <AttendanceSummaryBar summary={model.summary} />
      <div className={styles.mainGrid}>
        <AttendanceChartsColumn model={model} />
        <AttendanceListColumn model={model} />
      </div>
    </>
  );
}
