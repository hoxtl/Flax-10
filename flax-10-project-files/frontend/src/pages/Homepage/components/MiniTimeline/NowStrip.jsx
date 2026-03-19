import React from "react";
import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";

export function NowStrip({ hasTimerSession, timerMode, timerTask, timeLeft, currentBlock, styles }) {
  if (hasTimerSession) return (
    <div className={styles.planTimelineNowStrip}>
      <span className={styles.planTimelineNowStripDot} aria-hidden />
      <span className={styles.planTimelineNowStripLabel}>{timerMode === "break" ? "Break" : "Focus"}</span>
      <span className={styles.planTimelineNowStripTask}>{timerTask || "Session in progress"}</span>
      <span className={styles.planTimelineNowStripTimer}>
        {String(Math.floor((timeLeft || 0) / 60)).padStart(2, "0")}:{String((timeLeft || 0) % 60).padStart(2, "0")}
      </span>
    </div>
  );

  if (currentBlock) return (
    <div className={styles.planTimelineNowStrip}>
      <span className={styles.planTimelineNowStripDot} aria-hidden />
      <span className={styles.planTimelineNowStripLabel}>Now</span>
      <span className={styles.planTimelineNowStripTask}>{stripEmojiFromTitle(currentBlock.title)}</span>
      <span className={styles.planTimelineNowStripTimer}>{formatTime(currentBlock.end_time)}</span>
    </div>
  );

  return null;
}
