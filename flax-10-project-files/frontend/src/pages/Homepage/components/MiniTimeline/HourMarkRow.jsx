/**
 * Plan timeline hour mark row.
 */

export function HourMarkRow({ row, styles }) {
  return (
    <div key={row.id} className={styles.planTimelineHourMark}>
      <span className={styles.planTimelineHourMarkLabel}>
        {String(row.hour).padStart(2, "0")}:00
      </span>
      <span className={styles.planTimelineHourMarkDot} aria-hidden />
      <span className={styles.planTimelineHourMarkLine} aria-hidden />
    </div>
  );
}
