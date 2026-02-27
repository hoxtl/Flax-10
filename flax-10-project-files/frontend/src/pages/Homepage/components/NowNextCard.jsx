/**
 * Now & Next slim banner: NOW = current block, UP NEXT = first block that starts after now.
 */

import { useMemo } from "react";
import { isNow } from "../utils/eventUtils";
import { formatTime } from "../utils/dateFormatUtils";
import { getNowBannerIdleMessage } from "../utils/messageUtils";
import { GrowthTank } from "./GrowthTank";
import styles from "../Homepage.module.css";

export function NowNextCard({ dayEvents, selectedDate, now: nowProp, hasOverdueToday = false, isLateNight = false, taskProgress = null }) {
  const nowItem = useMemo(
    () => dayEvents.find((e) => isNow(e.start_time, e.end_time)),
    [dayEvents]
  );
  const nextItem = useMemo(() => {
    const nowMs = nowProp.getTime();
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return sorted.find((e) => e.id !== nowItem?.id && new Date(e.start_time).getTime() > nowMs) ?? null;
  }, [dayEvents, nowProp, nowItem]);
  const nextText = nextItem
    ? `${nextItem.title} at ${formatTime(nextItem.start_time)}`
    : "Nothing else today—time to rest! 🪴";

  const hasActiveNow = !!nowItem;
  const idleMessage = useMemo(
    () => getNowBannerIdleMessage({ nextItem, selectedDate, now: nowProp, hasOverdueToday }),
    [nextItem, selectedDate, nowProp, hasOverdueToday]
  );

  const completed = taskProgress?.crushed ?? 0;
  const total = taskProgress?.total ?? 0;

  return (
    <div
      className={`${styles.nowNextBanner} ${hasActiveNow ? styles.nowNextBannerActive : styles.nowNextBannerIdle} ${isLateNight ? styles.nowNextBannerNight : ""}`}
    >
      <GrowthTank completed={completed} total={total} goalsCrushed={completed} />
      <span className={styles.nowNextSep}>·</span>
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>NOW:</span>{" "}
        {hasActiveNow ? (
          <span className={styles.nowNextCurrent}>{nowItem.title}</span>
        ) : (
          <span className={styles.nowNextIdle}>{idleMessage}</span>
        )}
      </span>
      <span className={styles.nowNextSep}>·</span>
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>UP NEXT:</span> {nextText}
      </span>
    </div>
  );
}
