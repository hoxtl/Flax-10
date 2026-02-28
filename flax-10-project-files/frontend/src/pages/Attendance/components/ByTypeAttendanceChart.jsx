import { PieChart } from "@mui/x-charts/PieChart";
import styles from "../AttendancePage.module.css";

/** Single responsibility: render by-type pie chart. */
export default function ByTypeAttendanceChart({ data, onSegmentClick }) {
  if (!data.length) {
    return <p className={styles.noData}>No data by type yet.</p>;
  }
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
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
                if (label) onSegmentClick("byType", label);
              }
            : undefined
        }
      />
      <div className={styles.legend}>
        {data.map(({ label, value }) => (
          <span key={label}>{label}: {value}</span>
        ))}
      </div>
    </>
  );
}
