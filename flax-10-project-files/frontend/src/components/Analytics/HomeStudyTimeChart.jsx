/**
 * Time-management chart for Home: study/focus hours per day.
 * - Gradient bars: deep Sage at bottom → Flax Gold at top
 * - Horizontal dashed "Daily Goal" line; bars that cross it glow
 * Data: daily_breakdown (work minutes) or daily_progress (actual_hours)
 */
import styles from "./HomeStudyTimeChart.module.css";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_GOAL_HOURS = 2;

function normalizeData(data, dailyGoalHours) {
  if (!data || !Array.isArray(data)) return { labels: WEEKDAY_LABELS, hours: [0, 0, 0, 0, 0, 0, 0], max: 1, goal: dailyGoalHours };
  const last7 = data.slice(-7);
  const pad = Math.max(0, 7 - last7.length);
  const labels = [];
  const hours = [];
  for (let i = 0; i < 7; i++) {
    if (i < pad) {
      labels.push(WEEKDAY_LABELS[i] || "");
      hours.push(0);
      continue;
    }
    const d = last7[i - pad];
    labels.push(new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" }));
    if (d.actual_hours != null) hours.push(parseFloat(d.actual_hours) || 0);
    else {
      const work = d.work != null ? d.work : 0;
      hours.push(Math.round((work / 60) * 10) / 10);
    }
  }
  const max = Math.max(DEFAULT_GOAL_HOURS, ...hours, 0.5);
  return { labels, hours, max, goal: dailyGoalHours };
}

export default function HomeStudyTimeChart({ data, dailyGoalHours = DEFAULT_GOAL_HOURS }) {
  const { labels, hours, max, goal } = normalizeData(data, dailyGoalHours);
  const goalPercent = max > 0 ? (goal / max) * 100 : 0;

  return (
    <div className={styles.chart}>
      <div className={styles.chartArea}>
        <div
          className={styles.goalLine}
          style={{ bottom: `${goalPercent}%` }}
          title={`Daily goal: ${goal}h`}
          aria-hidden
        />
        <div className={styles.bars}>
          {labels.map((label, i) => {
            const value = hours[i] ?? 0;
            const heightPercent = max > 0 ? Math.max(4, (value / max) * 100) : 4;
            const meetsGoal = value >= goal && goal > 0;
            return (
              <div key={`${label}-${i}`} className={styles.barGroup}>
                <div
                  className={`${styles.bar} ${meetsGoal ? styles.barGlow : ""}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${label}: ${value.toFixed(1)}h${meetsGoal ? " ✓ Goal" : ""}`}
                  role="img"
                  aria-label={`${label}: ${value.toFixed(1)} hours`}
                />
                <span className={styles.barLabel}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.goalCaption}>Daily goal: {goal}h</p>
    </div>
  );
}
