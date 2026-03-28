/*
 * Top status strip for the current timer session or active timeline block.
 */

import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { doesEventOverlapSleepWindow } from "../../../../components/settings/hooks/useSleepWarning";

function formatTimer(timeLeft) {
  const safe = timeLeft || 0;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function NowStripContent({ styles, label, task, timer, isSleepTime = false }) {
  return <div className={styles.planTimelineNowStrip}><span className={styles.planTimelineNowStripDot} aria-hidden /><span className={styles.planTimelineNowStripLabel}>{label}</span><span className={styles.planTimelineNowStripTask}>{task}{isSleepTime ? " 😴" : ""}</span><span className={styles.planTimelineNowStripTimer}>{timer}</span></div>;
}

export function NowStrip({ hasTimerSession, timerMode, timerTask, timeLeft, currentBlock, sleepWindow, styles }) {
  if (hasTimerSession) return <NowStripContent styles={styles} label={timerMode === "break" ? "Break" : "Focus"} task={timerTask || "Session in progress"} timer={formatTimer(timeLeft)} />;
  if (currentBlock) return <NowStripContent styles={styles} label="Now" task={stripEmojiFromTitle(currentBlock.title)} timer={formatTime(currentBlock.end_time)} isSleepTime={doesEventOverlapSleepWindow(sleepWindow?.sleepTime || "23:00", sleepWindow?.wakeTime || "07:00", currentBlock.start_time, currentBlock.end_time)} />;
  return null;
}
