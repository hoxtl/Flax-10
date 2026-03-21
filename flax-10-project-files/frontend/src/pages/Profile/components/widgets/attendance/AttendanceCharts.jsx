<<<<<<< HEAD
import ByTypeAttendanceChart from "../../../../attendance/components/ByTypeAttendanceChart";
import OverallAttendanceChart from "../../../../attendance/components/OverallAttendanceChart";
=======
import ByTypeAttendanceChart from "../../../../Attendance/components/ByTypeAttendanceChart";
import OverallAttendanceChart from "../../../../Attendance/components/OverallAttendanceChart";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import widgetStyles from "../ProfileWidgets.module.css";
import attendanceStyles from "../ProfileAttendance.module.css";

const styles = { ...widgetStyles, ...attendanceStyles };

function ChartBox({ label, children }) {
  return (
    <div className={styles.attendanceChartBox}>
      <div className={styles.attendanceChartLabel}>{label}</div>
      {children}
    </div>
  );
}

export default function AttendanceCharts({ overall, overallData, byTypeData, onSegmentClick }) {
  return (
    <div
      className={`${styles.attendanceCharts} ${styles.attendanceChartsRow}`}
      onClick={(event) => event.stopPropagation()}
    >
      <ChartBox label="Overall">
        <OverallAttendanceChart
          data={overallData}
          attended={overall.attended}
          missed={overall.missed}
          onSegmentClick={onSegmentClick}
        />
      </ChartBox>
      <ChartBox label="By Type">
        <ByTypeAttendanceChart data={byTypeData} onSegmentClick={onSegmentClick} />
      </ChartBox>
    </div>
  );
}
