/**
 * RIGHT NOW widget — answers "What do I need to know RIGHT NOW to stay on time?"
 * Sections: Header (pulsing dot + live clock), Current event, Up next, Travel, Overlap warning.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRelevantDelays,
  getTflLinesForLocation,
} from "../utils/kclTflMapping";
import { Sun, Clock, AlertTriangle, Bus, Sparkles } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import { useCountdown } from "../hooks/useCountdown";
import { isNow } from "../utils/eventUtils";
import styles from "./RightNowWidget.module.css";

/** Minutes left until event end — for time-left badge colour band. */
function getTimeLeftBand(minutesLeft) {
  if (minutesLeft == null || minutesLeft < 0) return "over";
  if (minutesLeft < 10) return "under10";
  if (minutesLeft < 30) return "10to30";
  return "over30";
}

function ActiveEventCard({ currentBlock, timeRangeStr, timeLeftStr, currentProgressPct }) {
  const minutesLeft =
    currentBlock?.end_time != null
      ? Math.max(0, Math.floor((new Date(currentBlock.end_time).getTime() - Date.now()) / 60000))
      : null;
  const band = getTimeLeftBand(minutesLeft);
  const timeLeftColor =
    band === "under10" ? "#dc3545" :
    band === "10to30" ? "#d4850a" :
    "#4A7C5A";

  return (
    <div className={styles.currentEventCard}>
      <div className={styles.currentEventRow1}>
        <span className={styles.currentEventCardTitle}>{currentBlock.title}</span>
        {timeLeftStr && (
          <span className={styles.currentEventTimeLeft} style={{ color: timeLeftColor }}>
            {timeLeftStr}
          </span>
        )}
      </div>
      {timeRangeStr && (
        <div className={styles.currentEventRow2}>
          <span className={styles.currentEventTimeRange}>{timeRangeStr}</span>
          {currentProgressPct != null && (
            <div className={styles.currentEventProgressTrack}>
              <motion.div
                className={styles.currentEventProgressFill}
                initial={{ width: "0%" }}
                animate={{ width: `${currentProgressPct}%` }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

const containerMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
};

const containerVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.1,
      delayChildren: 0,
    },
  },
};

const sectionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const staggerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerChildVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
  },
};

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
  const tasks = taskWidgetItemsOnly;
  const nav = navigatorContext || {};
  const nowMs = now.getTime();
  const liveClock = useLiveClock(30000);

  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], now);
  const nextEvent =
    nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], now);
  const nextEventTarget = nextEvent?.start_time ? new Date(nextEvent.start_time) : null;
  const countdown = useCountdown(nextEventTarget);
  const conflicts = Array.isArray(nav.overlaps) ? nav.overlaps : [];

  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const hasRelevantDelays = relevantDelays.length > 0;
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
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <div className={styles.headerIconWrap}>
            <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClockDot} aria-hidden />
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
      </motion.div>
    );
  }

  // --- Non-today ---
  if (!isToday) {
    const firstEv = sortedEvents?.[0];
    if (!firstEv)
      return (
        <motion.div
          initial={containerMotion.initial}
          animate={containerMotion.animate}
          transition={containerMotion.transition}
          className={styles.root}
        >
          <div className={styles.widgetHeader}>
            <div className={styles.headerIconWrap}>
              <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
            </div>
            <span className={styles.headerLabel}>Right Now</span>
            <span className={styles.headerClockDot} aria-hidden />
            <span className={styles.headerClock}>{liveClock}</span>
          </div>
          <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast}`}>
            <p className={styles.nowEmpty}>No events for this day.</p>
          </div>
        </motion.div>
      );
    const firstTime = firstEv.start_time ? formatTime(firstEv.start_time) : null;
    return (
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <div className={styles.headerIconWrap}>
            <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClockDot} aria-hidden />
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast}`}>
          <p className={styles.upNextTitle}>{firstEv.title}</p>
          {firstTime && <p className={styles.upNextDetails}>{firstTime}</p>}
        </div>
      </motion.div>
    );
  }

  const tomorrowTime = tomorrowFirstEvent?.start_time ? formatTime(tomorrowFirstEvent.start_time) : null;

  // --- End of day ---
  if (nav.state === "endOfDay") {
    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const eventsToday = (sortedEvents || []).filter(
      (e) => e.start_time && new Date(e.start_time).getTime() < nowMs
    ).length;
    return (
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <div className={styles.headerIconWrap}>
            <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClockDot} aria-hidden />
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={styles.endOfDayWrap}>
          <div className={styles.endOfDayTopRow}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={28} strokeWidth={1.25} color="#C4A46D" aria-hidden />
            </motion.div>
            <div>
              <p className={styles.endOfDayTitle}>Day complete — nice work!</p>
              {(completedCount > 0 || eventsToday > 0) && (
                <p className={styles.endOfDaySub}>
                  {completedCount > 0 && `${completedCount}${totalCount > 0 ? `/${totalCount}` : ""} tasks done`}
                  {completedCount > 0 && eventsToday > 0 && " · "}
                  {eventsToday > 0 && `${eventsToday} event${eventsToday !== 1 ? "s" : ""} attended`}
                </p>
              )}
            </div>
          </div>
          {tomorrowFirstEvent && (
            <>
              <div className={styles.sectionDivider} />
              <div className={styles.tomorrowSection}>
                <p className={styles.tomorrowLabel}>TOMORROW</p>
                <p className={styles.tomorrowFirstTitle}>{tomorrowFirstEvent.title}</p>
                {tomorrowTime && <p className={styles.tomorrowFirstTime}>at {tomorrowTime}</p>}
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // --- Countdown from useCountdown (updates every 60s, or 1s when < 5min) ---
  const eventTimeStr = nextEvent?.start_time ? formatTime(nextEvent.start_time) : "";
  const lineNames = [...new Set(relevantDelays.map((d) => d.lineName))];

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
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <div className={styles.headerIconWrap}>
            <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClockDot} aria-hidden />
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={styles.emptyDay}>
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Sun size={32} strokeWidth={1.25} color="#C4A46D" aria-hidden />
          </motion.div>
          <p className={styles.emptyDayTitle}>Nothing planned today</p>
          <p className={styles.emptyDaySubtitle}>Enjoy your day — or add something to your schedule</p>
          {tomorrowFirstEvent && tomorrowTime && (
            <p className={styles.emptyDayTomorrow}>Tomorrow starts with {tomorrowFirstEvent.title} at {tomorrowTime}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className={`${styles.root} ${hasActiveEvent ? styles.rootHasActive : ""}`}
    >
      {/* Header: Clock icon + "RIGHT NOW" + live clock (+ pulsing dot when happening now) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerVariants}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <motion.div className={styles.widgetHeader} variants={staggerChildVariants}>
          <div className={styles.headerIconWrap}>
            <Clock size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <span className={styles.headerLabel}>Right Now</span>
          <span className={styles.headerClockDot} aria-hidden />
          <span className={styles.headerClock}>{liveClock}</span>
        </motion.div>

      {/* Stats row — always shown */}
      <motion.div className={styles.statsRow} variants={staggerChildVariants}>
        <span>{(sortedEvents || []).length} events today</span>
        {tasks.filter((t) => !t.completed).length > 0 && (
          <>
            <span className={styles.statsDot}>·</span>
            <span>{tasks.filter((t) => !t.completed).length} tasks left</span>
          </>
        )}
      </motion.div>

      {/* Current event card — only if active */}
      {currentBlock?.title && (
        <motion.div className={`${styles.section} ${styles.sectionCurrent}`} variants={staggerChildVariants}>
          <ActiveEventCard
            currentBlock={currentBlock}
            timeRangeStr={timeRangeStr}
            timeLeftStr={timeLeftStr}
            currentProgressPct={currentProgressPct}
          />
        </motion.div>
      )}

      {/* Up next row */}
      {nextEvent ? (
        <motion.div className={styles.upNextRow} variants={staggerChildVariants}>
          <div className={styles.upNextRowLeft}>
            <span className={styles.upNextRowLabel}>Next:</span>
            <span className={styles.upNextRowTitle}>{nextEvent.title}</span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={countdown.text}
              className={styles.upNextRowCountdown}
              style={{
                color:
                  countdown.urgency === "urgent" ? "#B87A6D" :
                  countdown.urgency === "soon" ? "#C4946D" : "#A89279",
              }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {countdown.text || ""}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div className={styles.nowEmptyRow} variants={staggerChildVariants}>
          <motion.div
            className={styles.nowEmptyIconWrap}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={28} strokeWidth={1.25} className={styles.nowEmptyIconRelaxed} aria-hidden />
          </motion.div>
          <div className={styles.nowEmptyTextWrap}>
            <p className={styles.nowEmptyPrimary}>You&apos;re done for the day</p>
            <p className={styles.nowEmptySecondary}>No more events today</p>
          </div>
        </motion.div>
      )}

      {/* Commute row — compact */}
      <motion.div className={styles.commuteRow} variants={staggerChildVariants}>
        <div className={styles.commuteRowLeft}>
          <Bus size={14} strokeWidth={1.75} className={styles.commuteRowIcon} aria-hidden />
          <span className={styles.commuteRowText}>
            {hasCampus && nextEvent
              ? `Next commute in ${countdown.text || "…"}`
              : "No commute coming up"}
          </span>
        </div>
        <span
          className={styles.commuteRowStatus}
          style={{
            color:
              tflDelays === undefined ? "#B8A890" :
              hasRelevantDelays && hasCampus && nextEvent ? "#C4946D" : "#7BB38E",
          }}
        >
          {tflDelays === undefined
            ? "Checking…"
            : hasRelevantDelays && hasCampus && nextEvent
              ? `${lineNames[0] || "Line"} delays`
              : "All clear"}
        </span>
      </motion.div>

      {/* Overlap warning */}
      {Array.isArray(conflicts) && conflicts.length > 0 && (
        <motion.div variants={staggerChildVariants}>
          {conflicts.map((c, idx) => {
            const aTitle = c.a?.title || "Event A";
            const bTitle = c.b?.title || "Event B";
            const eventNames = [aTitle, bTitle].filter(Boolean).join(" & ");
            return (
              <div key={idx} className={styles.conflictRowNew} role="alert">
                <AlertTriangle size={13} strokeWidth={1.75} className={styles.conflictIconNew} aria-hidden />
                <span className={styles.conflictTextNew}>Overlap: {eventNames}</span>
              </div>
            );
          })}
        </motion.div>
      )}
      </motion.div>
    </motion.div>
  );
}
