/*
 * Weekly history chart.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';

function WeeklyBar({ day, maxWeeklySeconds }) {
  const ratio = Math.max(0.04, Number(day.seconds || 0) / maxWeeklySeconds);
  const hours = (Number(day.seconds || 0) / 3600).toFixed(1);

  return (
    <div className={styles.rightHistoryWeeklyBarCol}>
      <div className={styles.rightHistoryWeeklyBarTrack}>
        <span className={styles.rightHistoryWeeklyBarFill} style={{ height: `${Math.round(ratio * 100)}%` }} />
      </div>
      <span className={styles.rightHistoryWeeklyBarLabel}>{day.label}</span>
      <span className={styles.rightHistoryWeeklyValue}>{hours}h</span>
    </div>
  );
}

export function WeeklyChart({ weeklySeries, maxWeeklySeconds }) {
  return (
    <section className={styles.rightHistoryWeeklySummary}>
      <div className={styles.rightHistoryWeeklyHeader}>Weekly Summary</div>
      <div className={styles.rightHistoryWeeklyChart} role="img" aria-label="Focus hours per day for the last 7 days">
        {weeklySeries.map((day) => <WeeklyBar key={day.key} day={day} maxWeeklySeconds={maxWeeklySeconds} />)}
      </div>
    </section>
  );
}
