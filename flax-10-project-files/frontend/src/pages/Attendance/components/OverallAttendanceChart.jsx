import { PieChart } from "@mui/x-charts/PieChart";
import styles from "../AttendancePage.module.css";

/** Single responsibility: render overall attended vs missed pie chart and percentage. */
export default function OverallAttendanceChart({ data, attended, missed, onSegmentClick }) {
  const total = attended + missed;
  const percentAttended = total > 0 ? Math.round((attended / total) * 100) : 0;

  if (!data.length) {
    return (
      <>
        {total > 0 && <p className={styles.percentLine}>{percentAttended}% attended</p>}
        <p className={styles.noData}>No overall data yet.</p>
      </>
    );
  }
  const valueFormatter = (v, context) => {
    const num =
      typeof context?.dataIndex === "number" && data[context.dataIndex] != null
        ? Number(data[context.dataIndex].value)
        : typeof v === "object" && v != null && "value" in v
          ? Number(v.value)
          : Number(v);
    if (total <= 0 || !Number.isFinite(num)) return "";
    const pct = Math.round((num / total) * 100);
    return `${pct}%`;
  };

  return (
    <>
      <p className={styles.percentLine}>{percentAttended}% attended</p>
      <PieChart
        series={[
          {
            data,
            innerRadius: 40,
            outerRadius: 90,
            paddingAngle: 2,
            cornerRadius: 4,
            valueFormatter: valueFormatter,
          },
        ]}
        height={220}
        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
        slotProps={{ legend: { hidden: true } }}
        sx={{ "& .MuiChartsLegend-label": { fill: "var(--text) !important" } }}
        onItemClick={
          onSegmentClick
            ? (ev, identifier, item) => {
                const label =
                  item?.label ?? data[identifier?.dataIndex]?.label;
                if (label) onSegmentClick("overall", label);
              }
            : undefined
        }
      />
      <div className={styles.legend}>
        <span className={styles.legendAttended}>Attended: {attended}</span>
        <span className={styles.legendMissed}>Missed: {missed}</span>
      </div>
    </>
  );
}
