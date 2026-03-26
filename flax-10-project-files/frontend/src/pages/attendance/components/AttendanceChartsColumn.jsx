/*
 * Attendance charts column.
 */

import ByTypeAttendanceChart from "./ByTypeAttendanceChart";
import OverallAttendanceChart from "./OverallAttendanceChart";
import styles from "../AttendancePage.module.css";
import chartStyles from "./AttendanceCharts.module.css";

export default function AttendanceChartsColumn({ model }) {
  return (
    <div className={styles.chartsCol}>
      <AttendanceEmptyNotice totalMarked={model.summary.totalMarked} />
      <AttendanceChartCard label="Overall"><OverallAttendanceChart data={model.overallData} attended={model.summary.attended} missed={model.summary.missed} onSegmentClick={model.selectSegment} /></AttendanceChartCard>
      <AttendanceChartCard label="By type"><ByTypeAttendanceChart data={model.byTypeData} onSegmentClick={model.selectSegment} /></AttendanceChartCard>
    </div>
  );
}

function AttendanceEmptyNotice({ totalMarked }) {
  if (totalMarked !== 0) return null;
  return <p className={chartStyles.empty}>No attendance recorded yet. Use the list to mark events, or you'll get a prompt during or after class.</p>;
}

function AttendanceChartCard({ label, children }) {
  return (
    <div className={styles.chartCard}>
      <p className={styles.chartCardLabel}>{label}</p>
      {children}
    </div>
  );
}
