/* Plan timeline now-marker row. */

import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { formatHour12h } from "../../utils/dateFormatUtils";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

export function NowRow({ row, styles, nowRowRef }) {
  const h = Math.floor(DAY_START_HOUR + row.nowMins / 60);
  const m = row.nowMins % 60;
  return (
    <TimelineRowLayout row={row} styles={styles} minHeight={28}>
      <div ref={nowRowRef}>
        <TimelineGutter row={row} styles={styles} timeLabel={formatHour12h(h, m)} />
      </div>
      <TimelineSpineCell styles={styles} />
      <div className={styles.planTimelineNowWrap}>
        <span className={styles.planTimelineNowDot} aria-hidden />
        <span className={styles.planTimelineNowTag}>Now</span>
        <span className={styles.planTimelineNowLine} aria-hidden />
      </div>
    </TimelineRowLayout>
  );
}
