/*
 * Plan timeline tiny gap row (<30 min).
 */

import { getTinyGapMinHeight, getTinyGapTimeLabel } from "./helpers/gapRowUtils";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

function TinyGapBody({ styles, minutes }) {
  return <div className={`${styles.planTimelineGapShortWindow} ${styles.planTimelineGapShortWindowNoActions}`}><span className={styles.planTimelineGapRail} aria-hidden /><div className={styles.planTimelineGapMain}><span className={styles.planTimelineGapLeadDot} aria-hidden /><span className={styles.planTimelineGapShortDur}>{`${minutes}m free`}</span><span className={styles.planTimelineGapSeparator} aria-hidden>·</span><span className={styles.planTimelineGapNoTasks}>Reset</span></div><span className={styles.planTimelineGapRail} aria-hidden /></div>;
}

export function TinyGapRow({ row, styles }) {
  const minutes = row.minutes ?? (row.endMins - row.startMins);
  return <TimelineRowLayout row={row} styles={styles} rowClassName={styles.planTimelineRowGap} minHeight={getTinyGapMinHeight(minutes)}><TimelineGutter row={row} styles={styles} timeLabel={getTinyGapTimeLabel(row.startMins)} /><TimelineSpineCell styles={styles} /><TinyGapBody styles={styles} minutes={minutes} /></TimelineRowLayout>;
}
