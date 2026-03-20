/*
 * Top status strip for the current timer session or active timeline block.
 */

import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";

function formatTimer(timeLeft) {
  return `${String(Math.floor((timeLeft || 0) / 60)).padStart(2, "0")}:${String((timeLeft || 0) % 60).padStart(2, "0")}`;
}

function NowStripContent({ styles, label, task, timer }) {
  return <div className={styles.planTimelineNowStrip}><span className={styles.planTimelineNowStripDot} aria-hidden /><span className={styles.planTimelineNowStripLabel}>{label}</span><span className={styles.planTimelineNowStripTask}>{task}</span><span className={styles.planTimelineNowStripTimer}>{timer}</span></div>;
}

export function NowStrip({ hasTimerSession, timerMode, timerTask, timeLeft, currentBlock, styles }) {
  if (hasTimerSession) return <NowStripContent styles={styles} label={timerMode === "break" ? "Break" : "Focus"} task={timerTask || "Session in progress"} timer={formatTimer(timeLeft)} />;
  if (currentBlock) return <NowStripContent styles={styles} label="Now" task={stripEmojiFromTitle(currentBlock.title)} timer={formatTime(currentBlock.end_time)} />;
  return null;
}
