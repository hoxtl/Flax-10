/*
 * Overall attendance chart.
 */

import AttendanceDonutChart from "./AttendanceDonutChart";
import AttendancePercentLine from "./AttendancePercentLine";
import { buildValueFormatter } from "../utils/attendanceChartUtils";
import { computeAttendancePct } from "../utils/attendanceSummary";
import styles from "./AttendanceCharts.module.css";

export default function OverallAttendanceChart({ data, attended, missed, onSegmentClick }) {
  if (!data.length) return <OverallAttendanceEmpty attended={attended} missed={missed} />;
  return <OverallAttendanceChartBody data={data} attended={attended} missed={missed} onSegmentClick={onSegmentClick} />;
}

function OverallAttendanceEmpty({ attended, missed }) {
  if (attended + missed === 0) return <p className={styles.noData}>No overall data yet.</p>;
  return <><AttendancePercentLine>{`${computeAttendancePct({ attended, missed })}% attended`}</AttendancePercentLine><p className={styles.noData}>No overall data yet.</p></>;
}

function OverallAttendanceChartBody({ data, attended, missed, onSegmentClick }) {
  const total = attended + missed;
  const percent = computeAttendancePct({ attended, missed });

  return (
    <>
      <AttendancePercentLine>{`${percent}% attended`}</AttendancePercentLine>
      <AttendanceDonutChart chart="overall" data={data} onSegmentClick={onSegmentClick} valueFormatter={buildValueFormatter(data, total)} />
    </>
  );
}
