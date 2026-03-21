/* Plan timeline hour-mark row. */
import { formatHour12h } from "../../utils/dateFormatUtils";

export function HourMarkRow({ row, styles }) {
  return (
    <div key={row.id} className={styles.planTimelineHourMark}>
      <span className={styles.planTimelineHourMarkLabel}>
        {formatHour12h(row.hour, 0)}
      </span>
      <span className={styles.planTimelineHourMarkDot} aria-hidden />
      <span className={styles.planTimelineHourMarkLine} aria-hidden />
    </div>
  );
}
