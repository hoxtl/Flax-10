/**
 * Plan timeline NOW marker row.
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";

export function NowRow({ row, styles }) {
  return (
    <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: 28 }}>
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>
          {String(Math.floor(DAY_START_HOUR + row.nowMins / 60)).padStart(2, "0")}:{String(row.nowMins % 60).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div className={styles.planTimelineNowWrap}>
        <span className={styles.planTimelineNowTag}>NOW</span>
        <span className={styles.planTimelineNowLine} aria-hidden />
      </div>
    </div>
  );
}
