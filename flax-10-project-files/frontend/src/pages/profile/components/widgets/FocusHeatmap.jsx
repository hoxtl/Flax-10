import Card from "../../../../components/common/Card/Card";
import StudyHeatmap from "../../../../components/analytics/components/StudyHeatmap";
import widgetStyles from "./ProfileWidgets.module.css";
import attendanceStyles from "./ProfileAttendance.module.css";
import { buildButtonActionProps, buildNavigateAction } from "./widgetActionProps";

const styles = { ...widgetStyles, ...attendanceStyles };

const DEFAULT_HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_HEATMAP_HOURS = Array.from({ length: 24 }, (_, h) => h);

function normalizeHeatmapRow(row, width) {
  const safeRow = Array.isArray(row) ? row.slice(0, width) : [];
  return [...safeRow, ...Array(Math.max(width - safeRow.length, 0)).fill(0)];
}

export function normalizeHeatmapData(heatmap) {
  const rawData = Array.isArray(heatmap?.data) ? heatmap.data : [];
  if (!rawData.length) return null;
  const hours = Array.isArray(heatmap?.hours) && heatmap.hours.length ? heatmap.hours : DEFAULT_HEATMAP_HOURS;
  const width = hours.length;
  const hasDays = Array.isArray(heatmap?.days) && heatmap.days.length > 0;
  const targetDays = hasDays ? heatmap.days : DEFAULT_HEATMAP_DAYS;
  const paddedRows = rawData.slice(0, targetDays.length).map((row) => normalizeHeatmapRow(row, width));
  const data = [...paddedRows, ...Array(Math.max(targetDays.length - paddedRows.length, 0)).fill(null).map(() => Array(width).fill(0))];
  return {
    data,
    days: targetDays.slice(0, data.length),
    hours,
  };
}

function getContributionColor(val, maxVal) {
  if (val == null) return "transparent";
  if (val === 0) return "color-mix(in srgb, var(--border) 60%, transparent)";
  const t = val / maxVal;
  if (t < 0.25) return "var(--heatmap-low)";
  if (t < 0.5) return "var(--heatmap-mid)";
  if (t < 0.75) return "var(--heatmap-high)";
  return "var(--heatmap-full)";
}

function buildContributionWeeks(dailyTotals) {
  const SHOW = Math.min(70, dailyTotals.length);
  const slice = dailyTotals.slice(-SHOW);
  const pad = (7 - (slice.length % 7)) % 7;
  const padded = [...Array(pad).fill(null), ...slice];
  const weeks = [];
  for (let w = 0; w < Math.ceil(padded.length / 7); w++) {
    weeks.push(padded.slice(w * 7, (w + 1) * 7));
  }
  return weeks;
}

function ContributionCell({ val, maxVal }) {
  const cellStyle = { background: getContributionColor(val, maxVal) };
  return <div className={styles.contributionCell} style={cellStyle} title={val != null ? `${Math.round(val / 60 * 10) / 10}h` : ""} />;
}

function ContributionGrid({ weeks, maxVal }) {
  return (
    <div className={styles.contributionGrid}>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.contributionWeek}>
          {week.map((val, di) => <ContributionCell key={di} val={val} maxVal={maxVal} />)}
        </div>
      ))}
    </div>
  );
}

function FocusHeatmapHeader({ isInteractive, onNavigate }) {
  return (
    <div className={styles.heatmapHeader}>
      <div className={styles.cardLabel}>FOCUS HEATMAP</div>
      {isInteractive
        ? <button type="button" className={`${styles.heatmapLinkBtn} ${styles.compactAttAnalysisBtn}`} onClick={e => { e.stopPropagation(); onNavigate(); }}>View full analytics</button>
        : <div className={styles.heatmapLinkBtn}>View full analytics</div>}
    </div>
  );
}

function buildInteractiveProps(onNavigate) {
  const isInteractive = typeof onNavigate === "function";
  const handleNavigate = buildNavigateAction(onNavigate, "analytics");
  return { isInteractive, actionProps: buildButtonActionProps(isInteractive, handleNavigate), handleNavigate };
}

export function FocusHeatmapWidget({ heatmap, onNavigate }) {
  const normalizedHeatmap = normalizeHeatmapData(heatmap);
  if (!normalizedHeatmap) return null;
  const { isInteractive, actionProps, handleNavigate } = buildInteractiveProps(onNavigate);
  return (
    <Card
      className={`${styles.glassCard} ${styles.focusHeatmapCard} ${isInteractive ? styles.focusHeatmapCardInteractive : ""}`}
      variant="glass"
      {...actionProps}
    >
      <FocusHeatmapHeader isInteractive={isInteractive} onNavigate={handleNavigate} />
      <StudyHeatmap heatmapData={normalizedHeatmap} />
    </Card>
  );
}

function buildContributionData(heatmap) {
  const dailyTotals = heatmap.data.map((row) => (Array.isArray(row) ? row.reduce((sum, value) => sum + value, 0) : 0));
  return {
    dailyTotals,
    maxVal: Math.max(...dailyTotals, 1),
    weeks: buildContributionWeeks(dailyTotals),
  };
}

export function ContributionHeatmap({ heatmap, onNavigate }) {
  if (!heatmap?.data?.length) return null;
  const { maxVal, weeks } = buildContributionData(heatmap);
  return (
    <Card
      className={`${styles.glassCard} ${styles.contributionCard}`}
      variant="glass"
      {...buildButtonActionProps(true, buildNavigateAction(onNavigate, "analytics"))}
    >
      <div className={styles.heatmapHeader}>
        <div className={styles.cardLabel}>FOCUS ACTIVITY</div>
        <div className={styles.heatmapLinkBtn}>View full analytics</div>
      </div>
      <ContributionGrid weeks={weeks} maxVal={maxVal} />
    </Card>
  );
}
