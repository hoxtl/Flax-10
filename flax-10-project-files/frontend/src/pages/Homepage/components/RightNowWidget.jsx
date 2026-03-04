/**
 * RIGHT NOW widget — answers "What do I need to know RIGHT NOW to stay on time?"
 * Sections: Header (pulsing dot + live clock), Current event, Up next, Travel, Overlap warning.
 */

import { useState, useEffect } from "react";
import {
  getRelevantDelays,
  getTflLineColor,
  getTflLinesForLocation,
  isSevereDisruption,
} from "../utils/kclTflMapping";
import { Sun, AlertCircle, Clock, CheckCircle, MapPin, AlertTriangle, Car } from "lucide-react";
import { formatTime, formatScheduleCountdown } from "../utils/dateFormatUtils";
import { isNow } from "../utils";
import styles from "./RightNowWidget.module.css";

function getCurrentBlock(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  return list.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time, now)) || null;
}

function getNextEvent(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  const nowMs = now.getTime();
  const future = list
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return future[0] || null;
}

function hasCampusCommute(nextEvent) {
  if (!nextEvent) return false;
  const loc = (nextEvent.location || "").trim();
  const title = (nextEvent.title || "").trim();
  const linesFromLoc = getTflLinesForLocation(loc).length > 0;
  const linesFromTitle = getTflLinesForLocation(title).length > 0;
  return linesFromLoc || linesFromTitle;
}

/** Format time remaining until end (e.g. "36m left") */
function formatTimeLeft(endTime, nowMs) {
  if (!endTime) return null;
  const end = new Date(endTime).getTime();
  const ms = end - nowMs;
  if (ms <= 0) return "Ended";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m left`;
  return `${m}m left`;
}

/** Live clock string "12:24 PM" */
function useLiveClock(intervalMs = 30000) {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return clock;
}

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
  taskWidgetItemsOnly = [],
}) {
  const nav = navigatorContext || {};
  const nowMs = now.getTime();
  const liveClock = useLiveClock(30000);

  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], now);
  const nextEvent =
    nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], now);
  const conflicts = Array.isArray(nav.overlaps) ? nav.overlaps : [];

  const countdownStr =
    scheduleCountdownSecs != null && isToday
      ? formatScheduleCountdown(scheduleCountdownSecs)
      : null;

  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const hasRelevantDelays = relevantDelays.length > 0;
  const hasAnyDelays = (tflDelays || []).length > 0;
  const anySuspension = hasRelevantDelays && relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
  const nonRelevantDelays = hasAnyDelays ? (tflDelays || []).filter((d) => !relevantDelays.some((r) => r.lineName === d.lineName)) : [];
  const [otherLinesExpanded, setOtherLinesExpanded] = useState(false);
  const hasCampus = hasCampusCommute(nextEvent);

  const hasActiveEvent = !!currentBlock?.title;
  const emptyDay = isToday && !currentBlock && !nextEvent && (sortedEvents || []).length === 0;

  // --- Timer session: single compact block ---
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
        <div className={styles.widgetHeader}>
          <span className={`${styles.headerDot} ${styles.headerDotActive}`} aria-hidden />
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast} ${styles.timerBlock}`}>
          <div className={styles.nowRow}>
            <span className={styles.nowLabel}>
              {isBreak ? "BREAK" : "FOCUS"} · {timerTask || (isBreak ? "Break time" : "Focus session")} · {fmt(timeLeft)} left
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>
            Open timer →
          </button>
        </div>
      </div>
    );
  }

  // --- Non-today ---
  if (!isToday) {
    const firstEv = sortedEvents?.[0];
    if (!firstEv)
      return (
        <div className={styles.root}>
          <div className={styles.widgetHeader}>
            <span className={styles.headerDot} aria-hidden />
            <span className={styles.headerLabel}>Right Now</span>
            <span className={styles.headerClock}>{liveClock}</span>
          </div>
          <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast}`}>
            <p className={styles.nowEmpty}>No events for this day.</p>
          </div>
        </div>
      );
    const firstTime = firstEv.start_time ? formatTime(firstEv.start_time) : null;
    return (
      <div className={styles.root}>
        <div className={styles.widgetHeader}>
          <span className={styles.headerDot} aria-hidden />
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast}`}>
          <p className={styles.upNextTitle}>{firstEv.title}</p>
          {firstTime && <p className={styles.upNextDetails}>{firstTime}</p>}
        </div>
      </div>
    );
  }

  // --- End of day ---
  if (nav.state === "endOfDay") {
    const completedCount = taskWidgetItemsOnly.filter((t) => t.completed).length;
    const totalCount = taskWidgetItemsOnly.length;
    const eventsToday = (sortedEvents || []).filter(
      (e) => e.start_time && new Date(e.start_time).getTime() < nowMs
    ).length;
    const tomorrowTime = tomorrowFirstEvent?.start_time ? formatTime(tomorrowFirstEvent.start_time) : null;
    return (
      <div className={styles.root}>
        <div className={styles.widgetHeader}>
          <span className={styles.headerDot} aria-hidden />
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={`${styles.section} ${styles.sectionFirst}`}>
          <p className={styles.nowEmpty}>Day complete · great work today</p>
        </div>
        {(completedCount > 0 || eventsToday > 0) && (
          <div className={styles.section}>
            <p className={styles.nowEmpty}>
              {completedCount > 0 && `${completedCount}${totalCount > 0 ? `/${totalCount}` : ""} tasks`}
              {completedCount > 0 && eventsToday > 0 && " · "}
              {eventsToday > 0 && `${eventsToday} event${eventsToday !== 1 ? "s" : ""} attended`}
            </p>
          </div>
        )}
        {tomorrowFirstEvent && (
          <div className={`${styles.section} ${styles.sectionLast}`}>
            <p className={styles.upNextLabel}>Tomorrow</p>
            <p className={styles.upNextTitle}>{tomorrowFirstEvent.title}</p>
            {tomorrowTime && <p className={styles.upNextDetails}>at {tomorrowTime}</p>}
          </div>
        )}
        {!tomorrowFirstEvent && (completedCount > 0 || eventsToday > 0) && (
          <div className={`${styles.section} ${styles.sectionLast}`} />
        )}
      </div>
    );
  }

  // --- Countdown pill text and urgency: >15min normal, 5–15 yellow, <5 red ---
  const msUntil = nextEvent ? new Date(nextEvent.start_time).getTime() - nowMs : 0;
  const minsUntil = Math.floor(msUntil / 60000);
  const rawCountdown =
    countdownStr != null
      ? countdownStr.replace(/^\s*in\s+/i, "").trim()
      : msUntil > 0
      ? (() => {
          const h = Math.floor(msUntil / 3600000);
          const m = Math.floor((msUntil % 3600000) / 60000);
          return `${h > 0 ? `${h}h ` : ""}${m}m`;
        })()
      : null;
  const urgencyUnder5 = minsUntil >= 0 && minsUntil < 5;
  const urgency5To15 = minsUntil >= 5 && minsUntil < 15;

  const leaveMins = 10;
  const eventTimeStr = nextEvent?.start_time ? formatTime(nextEvent.start_time) : "";
  const locationPart = nextEvent?.location?.trim()
    ? ` at ${nextEvent.location}`
    : "";
  const lineNames = [...new Set(relevantDelays.map((d) => d.lineName))];
  const firstLine = lineNames[0] || "Line";
  const lineLabel = lineNames.length > 1 ? `${firstLine} and other lines` : `${firstLine} line`;
  const suggestText = anySuspension
    ? `consider alternative route to ${(nextEvent?.location || "campus").replace(/,.*/, "").trim() || "campus"} for ${eventTimeStr}`
    : `leave ~${leaveMins} mins early for your ${eventTimeStr}${locationPart}`;
  const bannerTitle = anySuspension ? `${firstLine} line suspended` : `${lineLabel} delays`;

  // Current event progress %
  const currentProgressPct =
    currentBlock?.start_time && currentBlock?.end_time
      ? (() => {
          const evStart = new Date(currentBlock.start_time).getTime();
          const evEnd = new Date(currentBlock.end_time).getTime();
          if (evEnd <= evStart) return null;
          return Math.min(100, Math.max(0, ((nowMs - evStart) / (evEnd - evStart)) * 100));
        })()
      : null;

  const timeRangeStr =
    currentBlock?.start_time && currentBlock?.end_time
      ? `${formatTime(currentBlock.start_time)} – ${formatTime(currentBlock.end_time)}`
      : null;
  const timeLeftStr = currentBlock?.end_time ? formatTimeLeft(currentBlock.end_time, nowMs) : null;

  // --- Empty day state ---
  if (emptyDay) {
    return (
      <div className={styles.root}>
        <div className={styles.widgetHeader}>
          <span className={styles.headerDot} aria-hidden />
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={styles.emptyDay}>
          <p className={styles.emptyDayTitle}>
            <CheckCircle size={18} className={styles.emptyDayIcon} aria-hidden /> Your day is clear
          </p>
          <p className={styles.emptyDaySubtitle}>No events scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${hasActiveEvent ? styles.rootHasActive : ""}`}>
      {/* Header: pulsing dot + "Right Now" + live clock */}
      <div className={styles.widgetHeader}>
        <span
          className={`${styles.headerDot} ${hasActiveEvent ? styles.headerDotActive : ""}`}
          aria-hidden
        />
        <span className={styles.headerLabel}>Right Now</span>
        <span className={styles.headerClock}>{liveClock}</span>
      </div>

      {/* Current event section */}
      <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionCurrent}`}>
        {currentBlock?.title ? (
          <>
            <div className={styles.currentEventRow}>
              <div className={styles.currentEventMain}>
                <p className={styles.currentEventTitle}>{currentBlock.title}</p>
                {currentBlock.location?.trim() && (
                  <p className={styles.currentEventLocation}>
                    <MapPin size={14} className={styles.locationIcon} aria-hidden />
                    {currentBlock.location.trim()}
                  </p>
                )}
                {timeRangeStr && (
                  <p className={styles.currentEventTime}>{timeRangeStr}</p>
                )}
              </div>
              {timeLeftStr && (
                <span className={styles.currentEventBadge}>{timeLeftStr}</span>
              )}
            </div>
            {currentProgressPct != null && (
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${currentProgressPct}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <div className={styles.nowEmptyRow}>
            <Sun size={18} className={styles.nowEmptyIcon} aria-hidden />
            <p className={styles.nowEmpty}>Nothing on right now</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={styles.sectionDivider} aria-hidden />

      {/* Up next section */}
      <div className={styles.section}>
        {nextEvent ? (
          <div className={styles.upNextCard}>
            <div className={styles.upNextCardLeft}>
              <p className={styles.upNextLabel}>UP NEXT</p>
              <p className={styles.upNextTitle}>{nextEvent.title}</p>
              <p className={styles.upNextDetails}>{eventTimeStr}</p>
            </div>
            {rawCountdown != null && minsUntil >= 0 && (
              <span
                className={
                  urgencyUnder5
                    ? styles.countdownPillUrgent
                    : urgency5To15
                      ? styles.countdownPillWarning
                      : styles.countdownPill
                }
              >
                {urgencyUnder5 && <AlertCircle size={14} className={styles.countdownIconUrgent} aria-hidden />}
                {urgency5To15 && !urgencyUnder5 && <Clock size={14} className={styles.countdownIconWarning} aria-hidden />}
                in {rawCountdown}
              </span>
            )}
          </div>
        ) : (
          <p className={styles.noMoreEvents}>No more events today</p>
        )}
      </div>

      {/* Travel: emoji + message only */}
      <div className={`${styles.section} ${styles.sectionTravel}`}>
        {tflDelays === undefined ? (
          <div className={styles.travelRow}>
            <Car size={16} className={styles.travelIcon} aria-hidden />
            <span className={styles.travelText}>Checking travel…</span>
          </div>
        ) : hasRelevantDelays && nextEvent ? (
          <>
            <div
              className={`${styles.travelBanner} ${anySuspension ? styles.travelBannerSuspension : ""}`}
              role="alert"
            >
              <AlertTriangle size={16} className={styles.travelBannerIcon} aria-hidden />
              <div className={styles.travelBannerContent}>
                <p className={styles.travelBannerMessage}>
                  {bannerTitle} — {suggestText}
                </p>
                <div className={styles.tflLineList}>
                  {relevantDelays.map((d, i) => (
                    <div key={i} className={styles.tflLineRow}>
                      <span
                        className={styles.tflDot}
                        style={{ background: getTflLineColor(d.lineName) }}
                        aria-hidden
                      />
                      <span>{d.lineName}</span>
                      <span className={styles.tflStatus}>· {d.severityDescription}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : !hasCampus && nextEvent ? (
          <div className={styles.travelRow}>
            <CheckCircle size={14} className={styles.travelIconOk} aria-hidden />
            <span className={styles.travelText}>No campus commute coming up</span>
          </div>
        ) : hasAnyDelays && !hasRelevantDelays ? (
          <>
            <div className={styles.travelRow}>
              <CheckCircle size={14} className={styles.travelIconOk} aria-hidden />
              <span className={styles.travelText}>Your commute looks clear</span>
            </div>
            {nonRelevantDelays.length > 0 && (
              <button
                type="button"
                className={styles.otherLinesToggle}
                onClick={() => setOtherLinesExpanded((e) => !e)}
              >
                {otherLinesExpanded
                  ? "Show less"
                  : `${nonRelevantDelays.length} other line${nonRelevantDelays.length !== 1 ? "s" : ""} affected`}
              </button>
            )}
            {otherLinesExpanded && nonRelevantDelays.length > 0 && (
              <div className={styles.tflLineList}>
                {nonRelevantDelays.map((d, i) => (
                  <div key={i} className={styles.tflLineRow}>
                    <span
                      className={styles.tflDot}
                      style={{ background: getTflLineColor(d.lineName) }}
                      aria-hidden
                    />
                    <span>{d.lineName}</span>
                    <span className={styles.tflStatus}>· {d.severityDescription}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.travelRow}>
            <CheckCircle size={14} className={styles.travelIconOk} aria-hidden />
            <span className={styles.travelText}>All lines running normally</span>
          </div>
        )}
      </div>

      {/* Overlap warning */}
      {Array.isArray(conflicts) && conflicts.length > 0 && (
        <div className={styles.section}>
          {conflicts.map((c, idx) => {
            const atTime = c.at
              ? new Date(c.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : null;
            const aTitle = c.a?.title || "Event A";
            const bTitle = c.b?.title || "Event B";
            return (
              <div key={idx} className={styles.conflictRow} role="alert">
                <AlertTriangle size={14} className={styles.conflictIcon} aria-hidden />
                <span className={styles.conflictText}>
                  Overlap{atTime ? ` at ${atTime}` : ""} — {aTitle} & {bTitle}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
