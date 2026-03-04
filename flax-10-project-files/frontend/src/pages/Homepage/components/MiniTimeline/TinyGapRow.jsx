/**
 * Plan timeline tiny gap row (< 30min).
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";

export function TinyGapRow({ row, styles }) {
  const mins = row.minutes ?? (row.endMins - row.startMins);
  return (
    <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: 20 }}>
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>
          {String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0")}:{String(row.startMins % 60).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div className={styles.planTimelineTinyGapLineWrap}>
        <div className={styles.planTimelineTinyGapLine} aria-hidden />
        <span className={styles.planTimelineTinyGapMicroBreak}>{mins}m reset</span>
      </div>
    </div>
  );
}
