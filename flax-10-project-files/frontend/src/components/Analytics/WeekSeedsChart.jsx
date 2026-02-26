/**
 * Your Week in Seeds: thin sage green bars, dashed daily goal line, gold/flax glow when bar reaches goal.
 * STRICTLY NO TAILWIND.
 */
import styles from "./WeekSeedsChart.module.css";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekSeedsChart({ data, dailyGoal = 1 }) {
  const values = Array.isArray(data) && data.length >= 7 ? data.slice(0, 7) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(dailyGoal, ...values, 1);
  const goalPercent = max > 0 ? (dailyGoal / max) * 100 : 0;

  return (
    <div className={styles.chart}>
      <div className={styles.chartArea}>
        <div
          className={styles.goalLine}
          style={{ bottom: `${goalPercent}%` }}
          title={`Daily goal: ${dailyGoal} seed${dailyGoal !== 1 ? "s" : ""}`}
          aria-hidden
        />
        <div className={styles.bars}>
          {WEEK_LABELS.map((label, i) => {
            const value = values[i] ?? 0;
            const heightPercent = max > 0 ? Math.max(6, (value / max) * 100) : 6;
            const meetsGoal = value >= dailyGoal && dailyGoal > 0;
            return (
              <div key={label} className={styles.barGroup}>
                <div
                  className={`${styles.bar} ${meetsGoal ? styles.barGlow : ""}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${label}: ${value} seed${value !== 1 ? "s" : ""}${meetsGoal ? " ✓" : ""}`}
                  role="img"
                  aria-label={`${label}: ${value} seeds`}
                />
                <span className={styles.barLabel}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
