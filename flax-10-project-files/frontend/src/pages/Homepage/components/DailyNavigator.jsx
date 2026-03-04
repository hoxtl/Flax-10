/**
 * Day Status Bar — slim time-management strip replacing the old heavy DailyNavigator.
 * Shows: date · current schedule state + countdown · next item
 * When Pomodoro session active: compact inline timer controls.
 */

import { formatScheduleCountdown } from "../utils/dateFormatUtils";

function fmtTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DailyNavigator({
  styles,
  navigatorContext,
  scheduleCountdownSecs,
  isToday,
  hasTimerSession,
  timerMode,
  timerTask,
  timeLeft,
  timerProgress,
  timerActive,
  nowCardRef,
  onResetTimer,
  onReplanDay,
  onSetTimerActive,
  onRestartTimer,
  onNavigate,
}) {
  const nav = navigatorContext;
  const countdownStr =
    scheduleCountdownSecs != null && isToday
      ? formatScheduleCountdown(scheduleCountdownSecs)
      : null;

  const today = new Date();
  const dateLabel = today
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();

  /* ── Timer active: compact Pomodoro strip ── */
  if (hasTimerSession) {
    const modeLabel = timerMode === "break" ? "BREAK" : "FOCUS";
    const taskLabel = timerTask || "Focus";
    const progress = Math.min(100, Math.max(0, timerProgress ?? 0));
    return (
      <div className={`${styles.dayStatusBar} ${styles.dayStatusTimerActive}`} ref={nowCardRef}>
        <span className={styles.dayStatusTimerMode}>{modeLabel}</span>
        <span className={styles.dayStatusTimerTask}>{taskLabel}</span>
        <span className={styles.dayStatusTimerCountdown}>{fmtTimer(timeLeft)}</span>
        <div className={styles.dayStatusTimerTrack}>
          <div className={styles.dayStatusTimerFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.dayStatusTimerActions}>
          <button
            type="button"
            className={styles.dayStatusTimerBtn}
            onClick={() => onSetTimerActive?.(!timerActive)}
          >
            {timerActive ? "Pause" : "Resume"}
          </button>
          <button type="button" className={styles.dayStatusTimerBtn} onClick={onRestartTimer}>
            Restart
          </button>
          <button type="button" className={styles.dayStatusTimerBtnEnd} onClick={onResetTimer}>
            End Session
          </button>
          <button
            type="button"
            className={styles.dayStatusTimerBtnSecondary}
            onClick={() => onNavigate?.("/timer", { state: { fromTaskPlay: true } })}
          >
            Full Timer ↗
          </button>
        </div>
      </div>
    );
  }

  /* ── Determine NOW section ── */
  let nowBadge = null;
  let nowText = null;
  let nowMeta = null;
  let nowVariant = "";

  if (isToday) {
    if (nav.state === "task" && nav.currentBlock?.title) {
      nowBadge = "NOW";
      nowText = nav.currentBlock.title;
      nowMeta = countdownStr ? `ends ${countdownStr}` : null;
      nowVariant = styles.dayStatusBadgeTask;
    } else if (nav.state === "gap") {
      const mins = nav.gapMins ?? 0;
      nowBadge = "FREE";
      nowText =
        mins >= 60
          ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim()
          : `${mins}m`;
      nowMeta = "window — use it well";
      nowVariant = styles.dayStatusBadgeFree;
    } else if (nav.state === "conflict") {
      nowBadge = "!";
      nowText = "Schedule conflict";
      nowMeta = null;
      nowVariant = styles.dayStatusBadgeConflict;
    } else if (nav.state === "endOfDay") {
      nowBadge = "✓";
      nowText = "Day complete";
      nowMeta = "great work";
      nowVariant = styles.dayStatusBadgeDone;
    }
  }

  /* ── NEXT section ── */
  const nextTitle = nav.nextItem?.title;
  const nextTime = nav.nextItem?.start_time
    ? new Date(nav.nextItem.start_time).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  // When in gap, countdownStr = time until next event starts
  const nextCountdown = countdownStr && nav.state !== "task" ? `in ${countdownStr}` : null;

  return (
    <div className={styles.dayStatusBar} ref={nowCardRef}>
      <span className={styles.dayStatusDate}>{dateLabel}</span>

      {nowBadge && (
        <div className={styles.dayStatusNow}>
          <span className={`${styles.dayStatusBadge} ${nowVariant}`}>{nowBadge}</span>
          <span className={styles.dayStatusNowText}>{nowText}</span>
          {nowMeta && <span className={styles.dayStatusNowMeta}>{nowMeta}</span>}
        </div>
      )}

      {!nowBadge && isToday && (
        <span className={styles.dayStatusNowText}>No events scheduled yet</span>
      )}

      {nextTitle && nav.state !== "endOfDay" && (
        <div className={styles.dayStatusNext}>
          <span className={styles.dayStatusNextLabel}>NEXT</span>
          <span className={styles.dayStatusNextText}>{nextTitle}</span>
          <span className={styles.dayStatusNextMeta}>
            {nextCountdown || (nextTime ? `at ${nextTime}` : "")}
          </span>
        </div>
      )}

      {nav.state === "conflict" && isToday && (
        <button type="button" className={styles.dayStatusActionBtn} onClick={onReplanDay}>
          Fix Schedule →
        </button>
      )}
    </div>
  );
}
