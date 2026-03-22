import Card from "../../../../components/Common/Card/Card";
import styles from "./ProfileWidgets.module.css";
import { buildButtonActionProps, buildNavigateAction } from "./widgetActionProps";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellOpacity(val, maxVal) {
  return val === 0 ? 0.07 : 0.15 + (val / maxVal) * 0.85;
}

function HeatmapCell({ val, maxVal, label }) {
  return (
    <div className={styles.heatmapCol}>
      <div
        className={styles.heatmapCell}
        style={{ opacity: cellOpacity(val, maxVal) }}
        title={`${label}: ${(val / 60).toFixed(1)}h`}
      />
      <span className={styles.heatmapDayLabel}>{label}</span>
    </div>
  );
}

function buildByDow(heatmap) {
  const byDow = Array.from({ length: 7 }, () => 0);
  heatmap.data.forEach((row, dayIndex) => {
    byDow[dayIndex % 7] += row.reduce((s, v) => s + v, 0);
  });
  return byDow;
}

function HeatmapCells({ byDow, maxVal }) {
  return byDow.map((val, index) => (
    <HeatmapCell key={index} val={val} maxVal={maxVal} label={DAY_LABELS[index]} />
  ));
}

export function MiniHeatmap({ heatmap, onNavigate }) {
  if (!heatmap?.data) return null;
  const byDow = buildByDow(heatmap);
  const maxVal = Math.max(...byDow, 1);
  const action = buildNavigateAction(onNavigate, "analytics");
  return (
    <Card
      className={`${styles.glassCard} ${styles.heatmapCard}`}
      variant="glass"
      {...buildButtonActionProps(true, action)}
    >
      <div className={styles.heatmapHeader}>
        <div className={styles.cardLabel}>STUDY ACTIVITY</div>
        <div className={styles.heatmapLinkBtn}>View full analytics</div>
      </div>
      <div className={styles.miniHeatmap}><HeatmapCells byDow={byDow} maxVal={maxVal} /></div>
    </Card>
  );
}
