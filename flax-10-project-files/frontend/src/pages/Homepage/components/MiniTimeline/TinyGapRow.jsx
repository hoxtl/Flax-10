/**
 * Plan timeline tiny gap row (< 30min).
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";

export function TinyGapRow({ row, styles }) {
  const mins = row.minutes ?? (row.endMins - row.startMins);
  const gapMinHeight = mins > 0 ? Math.max(24, Math.min(Math.round(mins * 1.15), 44)) : 24;
  const timeLabel = `${String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0")}:${String(row.startMins % 60).padStart(2, "0")}`;
  return (
    <div key={row.id} className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`} style={{ marginTop: row.spacingBeforePx || 0, minHeight: gapMinHeight }}>
      <div className={styles.planTimelineGutter}>
        {row.hideTimeLabel ? null : <span className={styles.planTimelineTime}>{timeLabel}</span>}
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}>
        <span className={styles.planTimelineGapRail} aria-hidden />
        <div className={styles.planTimelineGapMain}>
          <span className={styles.planTimelineGapLeadDot} aria-hidden />
          <span className={styles.planTimelineGapShortDur}>{`${mins}m free`}</span>
          <span className={styles.planTimelineGapSeparator} aria-hidden>·</span>
          <span className={styles.planTimelineGapNoTasks}>Reset</span>
        </div>
        <span className={styles.planTimelineGapRail} aria-hidden />
      </div>
    </div>
  );
}
