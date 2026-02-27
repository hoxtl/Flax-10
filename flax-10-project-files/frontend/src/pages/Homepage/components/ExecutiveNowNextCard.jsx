/**
 * Executive Now & Next Action Card: large high-contrast hero at top with countdown.
 */

import { useState, useEffect, useMemo } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { isNow } from "../utils/eventUtils";
import { formatTime } from "../utils/dateFormatUtils";
import { getNowBannerIdleMessage } from "../utils/messageUtils";
import styles from "../Homepage.module.css";

export function ExecutiveNowNextCard({
  dayEvents,
  selectedDate,
  now: nowProp,
  hasOverdueToday,
  overdueCount = 0,
  oldestOverdueTask,
  onQuickStart,
}) {
  const nowItem = useMemo(
    () => (dayEvents || []).find((e) => isNow(e.start_time, e.end_time)),
    [dayEvents]
  );
  const nextItem = useMemo(() => {
    const nowMs = nowProp.getTime();
    const sorted = [...(dayEvents || [])].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return sorted.find((e) => e.id !== nowItem?.id && new Date(e.start_time).getTime() > nowMs) ?? null;
  }, [dayEvents, nowProp, nowItem]);

  const [countdownSecs, setCountdownSecs] = useState(null);
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      if (nowItem) {
        const end = new Date(nowItem.end_time || nowItem.start_time);
        setCountdownSecs(Math.max(0, Math.round((end - n) / 1000)));
        return;
      }
      if (nextItem) {
        const start = new Date(nextItem.start_time);
        setCountdownSecs(Math.max(0, Math.round((start - n) / 1000)));
        return;
      }
      setCountdownSecs(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nowItem, nextItem]);

  const hasActiveNow = !!nowItem;
  const inFreeWindow = !hasActiveNow && isToday(selectedDate);
  const showGapPrompt = inFreeWindow && overdueCount > 0;
  const idleMessage = useMemo(
    () =>
      showGapPrompt
        ? `Gap detected! You have ${overdueCount} overdue task${overdueCount === 1 ? "" : "s"}—want to tackle one now?`
        : getNowBannerIdleMessage({ nextItem, selectedDate, now: nowProp, hasOverdueToday }),
    [showGapPrompt, overdueCount, nextItem, selectedDate, nowProp, hasOverdueToday]
  );
  const nowTitle = hasActiveNow ? nowItem.title : idleMessage;
  const nextText = nextItem
    ? `${nextItem.title} at ${formatTime(nextItem.start_time)}`
    : "Nothing else today—time to rest! 🪴";

  const mm = countdownSecs != null ? Math.floor(countdownSecs / 60) : null;
  const ss = countdownSecs != null ? countdownSecs % 60 : null;
  const countdownStr = mm != null ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : "—";

  return (
    <div className={styles.executiveActionCard}>
      <div className={styles.executiveActionCardNow}>
        <span className={styles.executiveActionCardNowLabel}>NOW</span>
        <h2 className={styles.executiveActionCardNowTitle}>{nowTitle}</h2>
        {showGapPrompt && oldestOverdueTask && onQuickStart && (
          <button
            type="button"
            className={styles.nowQuickStartBtn}
            onClick={() => onQuickStart(oldestOverdueTask)}
          >
            Quick Start
          </button>
        )}
        <span className={styles.executiveActionCardCountdown} aria-live="polite">{countdownStr}</span>
      </div>
      <div className={styles.executiveActionCardNext}>
        <span className={styles.executiveActionCardNextLabel}>UP NEXT</span>
        <span className={styles.executiveActionCardNextText}>{nextText}</span>
      </div>
    </div>
  );
}
