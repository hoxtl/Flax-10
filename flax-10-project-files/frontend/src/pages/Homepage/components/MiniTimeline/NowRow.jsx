/**
 * Plan timeline NOW marker row.
 */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { formatHour12h } from "../../utils/dateFormatUtils";

export function NowRow({ row, styles, nowRowRef }) {
  const h = Math.floor(DAY_START_HOUR + row.nowMins / 60);
  const m = row.nowMins % 60;
  return (
    <div ref={nowRowRef} key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: 28 }}>
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>
          {formatHour12h(h, m)}
        </span>
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      <div className={styles.planTimelineNowWrap}>
        <span className={styles.planTimelineNowDot} aria-hidden />
        <span className={styles.planTimelineNowTag}>Now</span>
        <span className={styles.planTimelineNowLine} aria-hidden />
      </div>
    </div>
  );
}
