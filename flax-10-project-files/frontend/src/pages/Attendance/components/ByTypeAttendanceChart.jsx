/*
 * Attendance by-type chart.
 */

import AttendanceDonutChart from "./AttendanceDonutChart";
import AttendanceLegend from "./AttendanceLegend";
import AttendancePercentLine from "./AttendancePercentLine";
import { buildValueFormatter } from "../utils/attendanceChartUtils";
import styles from "./AttendanceCharts.module.css";

export default function ByTypeAttendanceChart({ data, onSegmentClick }) {
  if (!data.length) return <p className={styles.noData}>No data by type yet.</p>;
  return <ByTypeAttendanceChartBody data={data} onSegmentClick={onSegmentClick} />;
}

function ByTypeAttendanceChartBody({ data, onSegmentClick }) {
  const total = data.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  return (
    <>
      <AttendancePercentLine hidden>spacer</AttendancePercentLine>
      <AttendanceDonutChart chart="byType" data={data} onSegmentClick={onSegmentClick} valueFormatter={buildValueFormatter(data, total)} />
      <AttendanceLegend>{data.map(({ label, value }) => <span key={label} className={styles.byTypeLegendItem}>{`${label}: ${value}`}</span>)}</AttendanceLegend>
    </>
  );
}
