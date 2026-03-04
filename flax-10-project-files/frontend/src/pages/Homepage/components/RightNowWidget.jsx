/**
 * RIGHT NOW widget — compact, actionable glance for KCL students.
 * Sections: 1) NOW  2) NEXT UP  3) SMART TRAVEL ALERT  4) SCHEDULE CONFLICTS
 * Uses existing TFL delays from API; kclTflMapping filters by next event location.
 */

import { MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getRelevantDelays,
  getTflLineColor,
  isSevereDisruption,
} from "../utils/kclTflMapping";
import { formatTime, formatScheduleCountdown } from "../utils/dateFormatUtils";
import styles from "./RightNowWidget.module.css";

export function RightNowWidget({
  now,
  isToday,
  navigatorContext,
  sortedEvents,
  scheduleCountdownSecs,
  tflDelays = [],
  hasTimerSession,
  timerMode,
  timeLeft,
  workTime,
  breakTime,
  timerTask,
  onOpenTimer,
  tomorrowFirstEvent,
  todayVsYesterday,
  actionHubItemsOnly = [],
}) {
  const nav = navigatorContext || {};
  const nowMs = now.getTime();

  const countdownStr =
    scheduleCountdownSecs != null && isToday
      ? formatScheduleCountdown(scheduleCountdownSecs)
      : null;

  const currentBlock = nav.currentBlock;
  const nextItem = nav.nextItem;
  const overlaps = nav.overlaps || [];
  const conflictAt = nav.conflictAt;

  const nextEvent =
    nextItem ||
    (sortedEvents || [])
      .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];

  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const hasRelevantDelays = relevantDelays.length > 0;
  const hasAnyDelays = (tflDelays || []).length > 0;
  const firstConflict = overlaps[0];

  // --- Timer session overrides ---
  if (hasTimerSession) {
    const isBreak = timerMode === "break";
    const totalSecs = (isBreak ? breakTime || 5 : workTime || 25) * 60;
    const pct = Math.max(0, Math.min(100, ((totalSecs - Math.max(0, timeLeft)) / totalSecs) * 100));
    const fmt = (s) => {
      const t = Math.max(0, s);
      return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    };
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <span className={styles.nowBadge}>{isBreak ? "BREAK" : "FOCUS"}</span>
          <span className={styles.nowText}>
            {timerTask || (isBreak ? "Break time" : "Focus session")} · {fmt(timeLeft)} left
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>
          Open timer →
        </button>
      </div>
    );
  }

  // --- Non-today: simple day overview ---
  if (!isToday) {
    const firstEv = sortedEvents?.[0];
    if (!firstEv)
      return (
        <div className={styles.root}>
          <div className={styles.section}>
            <span className={styles.nowEmpty}>No events for this day.</span>
          </div>
        </div>
      );
    const firstTime = firstEv.start_time ? formatTime(firstEv.start_time) : null;
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <span className={styles.nextLabel}>First:</span>
          <span className={styles.nextTitle}>{firstEv.title}</span>
          {firstTime && <span className={styles.nextMeta}> · {firstTime}</span>}
        </div>
      </div>
    );
  }

  // --- End of day state ---
  if (nav.state === "endOfDay") {
    const completedCount = actionHubItemsOnly.filter((t) => t.completed).length;
    const totalCount = actionHubItemsOnly.length;
    const eventsToday = (sortedEvents || []).filter(
      (e) => e.start_time && new Date(e.start_time).getTime() < nowMs
    ).length;
    const tomorrowTime = tomorrowFirstEvent?.start_time
      ? formatTime(tomorrowFirstEvent.start_time)
      : null;
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <span className={styles.nowBadge}>✓</span>
          <span className={styles.nowText}>Day complete · great work today</span>
        </div>
        {(completedCount > 0 || eventsToday > 0) && (
          <div className={styles.section}>
            <span className={styles.nowEmpty}>
              {completedCount > 0 && `${completedCount}${totalCount > 0 ? `/${totalCount}` : ""} tasks`}
              {completedCount > 0 && eventsToday > 0 && " · "}
              {eventsToday > 0 && `${eventsToday} event${eventsToday !== 1 ? "s" : ""} attended`}
            </span>
          </div>
        )}
        {todayVsYesterday && (
          <div className={styles.section}>
            <span className={styles.nowEmpty}>{todayVsYesterday.label}</span>
          </div>
        )}
        {tomorrowFirstEvent && (
          <div className={styles.section}>
            <span className={styles.nextLabel}>Tomorrow:</span>
            <span className={styles.nextTitle}>{tomorrowFirstEvent.title}</span>
            {tomorrowTime && <span className={styles.nextMeta}> at {tomorrowTime}</span>}
          </div>
        )}
      </div>
    );
  }

  // --- Section 1: NOW ---
  const renderNow = () => {
    if (currentBlock?.title) {
      const endTime = currentBlock.end_time ? formatTime(currentBlock.end_time) : null;
      const evStart = currentBlock.start_time ? new Date(currentBlock.start_time).getTime() : null;
      const evEnd = currentBlock.end_time ? new Date(currentBlock.end_time).getTime() : null;
      const progressPct =
        evStart != null && evEnd != null && evEnd > evStart
          ? Math.min(100, Math.max(0, ((nowMs - evStart) / (evEnd - evStart)) * 100))
          : null;

      return (
        <>
          <div className={styles.section}>
            <span className={styles.nowLabel}>In:</span>
            <span className={styles.nowText}>
              {currentBlock.title}
              {endTime ? ` · ends at ${endTime}` : ""}
            </span>
          </div>
          {progressPct != null && (
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </>
      );
    }
    return (
      <div className={styles.section}>
        <span className={styles.nowEmpty}>Nothing on right now</span>
      </div>
    );
  };

  // --- Section 2: NEXT UP ---
  const renderNextUp = () => {
    if (!nextEvent) {
      return (
        <div className={`${styles.section} ${styles.sectionNext}`}>
          <span className={styles.nextEmpty}>
            {currentBlock ? "Nothing after this" : "Nothing coming up today"}
          </span>
        </div>
      );
    }
    const timeStr = nextEvent.start_time ? formatTime(nextEvent.start_time) : "";
    const locStr = nextEvent.location?.trim() || "";
    const msUntil = new Date(nextEvent.start_time).getTime() - nowMs;
    const minsUntil = Math.floor(msUntil / 60000);
    const isUrgent = minsUntil <= 30 && minsUntil >= 0;
    const countdownPill =
      countdownStr ||
      (msUntil > 0
        ? (() => {
            const h = Math.floor(msUntil / 3600000);
            const m = Math.floor((msUntil % 3600000) / 60000);
            return `${h > 0 ? `${h}h ` : ""}${m}m`;
          })()
        : null);

    return (
      <div className={`${styles.section} ${styles.sectionNext}`}>
        <div className={styles.nextLine}>
          <span className={styles.nextLabel}>Next:</span>
          <span className={styles.nextTitle}>{nextEvent.title}</span>
          {timeStr && <span className={styles.nextMeta}> · {timeStr}</span>}
          {locStr && <span className={styles.nextMeta}> · {locStr}</span>}
        </div>
        {locStr && (
          <div className={styles.nextLine2}>
            <MapPin className={styles.nextIcon} size={12} aria-hidden />
            <span>{locStr}</span>
          </div>
        )}
        {countdownPill && (
          <span
            className={`${styles.countdownPill} ${isUrgent ? styles.countdownPillUrgent : ""}`}
          >
            in {countdownPill}
          </span>
        )}
      </div>
    );
  };

  // --- Section 3: SMART TRAVEL ALERT ---
  const renderTravelAlert = () => {
    if (tflDelays === undefined) {
      return (
        <div className={styles.section}>
          <span className={styles.tflLoading}>Checking travel…</span>
        </div>
      );
    }
    if (hasRelevantDelays && nextEvent) {
      const severe = relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
      const leaveMins = 10;
      const eventTimeStr = nextEvent.start_time ? formatTime(nextEvent.start_time) : "";
      const locationPart = nextEvent.location?.trim()
        ? ` for your ${eventTimeStr} at ${nextEvent.location}`
        : ` for your ${eventTimeStr} event`;

      const lineNames = [...new Set(relevantDelays.map((d) => d.lineName))].join(", ");

      return (
        <div
          className={`${styles.section} ${styles.travelBanner} ${severe ? styles.travelBannerSevere : ""}`}
          role="alert"
        >
          <AlertTriangle className={styles.travelIcon} size={18} aria-hidden />
          <div className={styles.travelContent}>
            <p className={styles.travelMessage}>
              {lineNames} {severe ? "disruption" : "delays"} — leave {leaveMins} mins early
              {locationPart}
            </p>
            <div className={styles.tflLineList}>
              {relevantDelays.map((d, i) => (
                <div key={i} className={styles.tflLineRow}>
                  <span
                    className={styles.tflDot}
                    style={{ background: getTflLineColor(d.lineName) }}
                    aria-hidden
                  />
                  <span className={styles.tflLineName}>{d.lineName}</span>
                  <span className={styles.tflSep}>·</span>
                  <span className={styles.tflStatus}>{d.severityDescription}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (hasAnyDelays && !hasRelevantDelays) {
      return (
        <div className={`${styles.section} ${styles.travelClear}`}>
          <CheckCircle2 size={14} className={styles.travelClearIcon} aria-hidden />
          <span>Your commute looks clear</span>
        </div>
      );
    }
    return null;
  };

  // --- Section 4: SCHEDULE CONFLICTS ---
  const renderConflicts = () => {
    if (!firstConflict || !conflictAt) return null;
    const timeStr = conflictAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const a = firstConflict.a?.title || "Event A";
    const b = firstConflict.b?.title || "Event B";
    return (
      <div className={`${styles.section} ${styles.conflictRow}`} role="alert">
        <AlertTriangle size={14} className={styles.conflictIcon} aria-hidden />
        <span>Overlap at {timeStr} — {a} and {b}</span>
      </div>
    );
  };

  // Minimal two-line when clear
  const nothingNow = !currentBlock?.title;
  const hasNext = !!nextEvent;
  const noAlerts = !hasRelevantDelays && !firstConflict;
  const isMinimal = isToday && nothingNow && hasNext && noAlerts;

  if (isMinimal) {
    const timeStr = nextEvent.start_time ? formatTime(nextEvent.start_time) : "";
    const msUntil = new Date(nextEvent.start_time).getTime() - nowMs;
    const countdownPill =
      countdownStr ||
      (msUntil > 0
        ? (() => {
            const h = Math.floor(msUntil / 3600000);
            const m = Math.floor((msUntil % 3600000) / 60000);
            return `in ${h > 0 ? `${h}h ` : ""}${m}m`;
          })()
        : null);
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <span className={styles.nowEmpty}>Nothing on right now</span>
        </div>
        <div className={`${styles.section} ${styles.sectionNext}`}>
          <span className={styles.nextLabel}>Next:</span>
          <span className={styles.nextTitle}>{nextEvent.title}</span>
          {timeStr && <span className={styles.nextMeta}> · {timeStr}</span>}
          {countdownPill && <span className={styles.countdownPill}>{countdownPill}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {renderNow()}
      {renderNextUp()}
      {renderTravelAlert()}
      {renderConflicts()}
    </div>
  );
}
