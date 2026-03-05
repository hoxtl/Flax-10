/**
 * RIGHT NOW widget — live schedule compass.
 * Shows: current event + progress, up next + countdown,
 * smart TFL leave-by alert, and schedule conflicts.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRelevantDelays,
  getTflLinesForLocation,
  getTflLinePillStyle,
  isSevereDisruption,
} from "../utils/kclTflMapping";
import { Sun, Clock, AlertTriangle, Train, Sparkles, CheckCircle } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import { useCountdown } from "../hooks/useCountdown";
import { isNow } from "../utils/eventUtils";
import styles from "./RightNowWidget.module.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTimeLeftBand(minutesLeft) {
  if (minutesLeft == null || minutesLeft < 0) return "over";
  if (minutesLeft < 10) return "under10";
  if (minutesLeft < 30) return "10to30";
  return "over30";
}

function getCurrentBlock(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  return list.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) || null;
}

function getNextEvent(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  const nowMs = now.getTime();
  return list
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
}

function hasCampusCommute(nextEvent) {
  if (!nextEvent) return false;
  const loc = (nextEvent.location || "").trim();
  const title = (nextEvent.title || "").trim();
  return getTflLinesForLocation(loc).length > 0 || getTflLinesForLocation(title).length > 0;
}

function formatTimeLeft(endTime, nowMs) {
  if (!endTime) return null;
  const ms = new Date(endTime).getTime() - nowMs;
  if (ms <= 0) return "Ended";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}

function useLiveClock() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(
      () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      30000
    );
    return () => clearInterval(id);
  }, []);
  return clock;
}

/**
 * Given relevant delays and the next event, compute a smart "leave by" recommendation.
 * Base commute buffer: 35 min. Severe disruption: +20 min. Minor: +10 min.
 */
function getLeaveByInfo(nextEvent, relevantDelays, nowMs) {
  if (!nextEvent?.start_time || !relevantDelays.length) return null;
  const startMs = new Date(nextEvent.start_time).getTime();
  const hasSevere = relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
  const bufferMins = 35 + (hasSevere ? 20 : 10);
  const leaveByMs = startMs - bufferMins * 60000;
  const minsUntilLeave = Math.floor((leaveByMs - nowMs) / 60000);
  const leaveByStr = new Date(leaveByMs).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (nowMs >= leaveByMs) {
    return { urgency: "critical", label: "Leave now", sub: `You may be late for ${nextEvent.title}`, leaveByStr, hasSevere };
  }
  if (minsUntilLeave <= 15) {
    return { urgency: "urgent", label: `Leave in ${minsUntilLeave}m`, sub: `to reach ${nextEvent.title} on time`, leaveByStr, hasSevere };
  }
  return { urgency: "info", label: `Leave by ${leaveByStr}`, sub: `${nextEvent.title} affected by delays`, leaveByStr, hasSevere };
}

// ─── Simple fade-in helper ───────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] },
  };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function WidgetHeader({ liveClock, eventCount, taskCount }) {
  return (
    <motion.div className={styles.widgetHeader} {...fadeIn(0)}>
      <div className={styles.headerIconWrap}>
        <Clock size={15} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
      </div>
      <span className={styles.headerLabel}>Right Now</span>
      <span className={styles.headerMeta}>
        {eventCount} event{eventCount !== 1 ? "s" : ""}
        {taskCount > 0 && ` · ${taskCount} task${taskCount !== 1 ? "s" : ""} left`}
      </span>
      <span className={styles.headerClockDot} aria-hidden />
      <span className={styles.headerClock}>{liveClock}</span>
    </motion.div>
  );
}

function ActiveEventCard({ currentBlock, timeRangeStr, timeLeftStr, currentProgressPct }) {
  const minutesLeft =
    currentBlock?.end_time != null
      ? Math.max(0, Math.floor((new Date(currentBlock.end_time).getTime() - Date.now()) / 60000))
      : null;
  const band = getTimeLeftBand(minutesLeft);
  const timeLeftColor =
    band === "under10" ? "#dc3545" : band === "10to30" ? "#d4850a" : "#4A7C5A";

  return (
    <motion.div className={styles.currentEventCard} {...fadeIn(0.07)}>
      <div className={styles.currentEventRow1}>
        <span className={styles.currentEventTitle}>{currentBlock.title}</span>
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
            <div className={styles.progressTrack}>
              <motion.div
                className={styles.progressFill}
                initial={{ width: "0%" }}
                animate={{ width: `${currentProgressPct}%` }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function TflDelayCard({ leaveByInfo, relevantDelays }) {
  const lineNames = [...new Set(relevantDelays.map((d) => d.lineName))];
  const isUrgent = leaveByInfo.urgency === "urgent" || leaveByInfo.urgency === "critical";
  const isCritical = leaveByInfo.urgency === "critical";

  return (
    <motion.div
      className={`${styles.tflCard} ${isCritical ? styles.tflCardCritical : isUrgent ? styles.tflCardUrgent : styles.tflCardInfo}`}
      {...fadeIn(0.14)}
      layout
    >
      <div className={styles.tflCardHeader}>
        <Train size={13} strokeWidth={2} className={styles.tflCardIcon} aria-hidden />
        <span className={styles.tflCardLabel}>{leaveByInfo.label}</span>
        {isUrgent && (
          <motion.span
            className={`${styles.tflBadge} ${isCritical ? styles.tflBadgeCritical : styles.tflBadgeUrgent}`}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {isCritical ? "NOW" : "SOON"}
          </motion.span>
        )}
      </div>
      <p className={styles.tflCardSub}>{leaveByInfo.sub}</p>
      <div className={styles.tflLinePills}>
        {lineNames.slice(0, 3).map((name) => {
          const pill = getTflLinePillStyle(name);
          return (
            <span
              key={name}
              className={styles.tflLinePill}
              style={{ background: pill.bg, color: pill.text }}
            >
              {name}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

function ConflictSummary({ conflicts }) {
  const [expanded, setExpanded] = useState(false);
  const count = conflicts.length;
  const label =
    count === 1
      ? `Overlap: ${conflicts[0].a?.title || "Event"} & ${conflicts[0].b?.title || "Event"}`
      : `${count} schedule overlaps today`;

  return (
    <motion.div className={styles.conflictWrap} {...fadeIn(0.21)}>
      <button
        type="button"
        className={styles.conflictPill}
        onClick={() => count > 1 && setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <AlertTriangle size={12} strokeWidth={2} className={styles.conflictIcon} aria-hidden />
        <span className={styles.conflictText}>{label}</span>
        {count > 1 && (
          <span className={styles.conflictChevron}>{expanded ? "▲" : "▼"}</span>
        )}
      </button>
      <AnimatePresence>
        {expanded && count > 1 && (
          <motion.div
            className={styles.conflictExpanded}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {conflicts.map((c, i) => (
              <p key={i} className={styles.conflictExpandedRow}>
                {c.a?.title || "Event"} &amp; {c.b?.title || "Event"}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Shared header for early-return views ───────────────────────────────────

function SimpleHeader({ liveClock }) {
  return (
    <motion.div className={styles.widgetHeader} {...fadeIn(0)}>
      <div className={styles.headerIconWrap}>
        <Clock size={15} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
      </div>
      <span className={styles.headerLabel}>Right Now</span>
      <span className={styles.headerClockDot} aria-hidden />
      <span className={styles.headerClock}>{liveClock}</span>
    </motion.div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function RightNowWidget({
  now,
  isToday,
  navigatorContext,
  sortedEvents,
  tflDelays = [],
  hasTimerSession,
  timerMode,
  timeLeft,
  workTime,
  breakTime,
  timerTask,
  onOpenTimer,
  tomorrowFirstEvent,
  taskWidgetItemsOnly = [],
}) {
  const nav = navigatorContext || {};
  const nowMs = now.getTime();
  const liveClock = useLiveClock();

  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], now);
  const nextEvent = nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], now);
  const nextEventTarget = nextEvent?.start_time ? new Date(nextEvent.start_time) : null;
  const countdown = useCountdown(nextEventTarget);
  const conflicts = Array.isArray(nav.overlaps) ? nav.overlaps : [];

  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const hasCampus = hasCampusCommute(nextEvent);
  const showTfl = relevantDelays.length > 0 && hasCampus && nextEvent;
  const leaveByInfo = showTfl ? getLeaveByInfo(nextEvent, relevantDelays, nowMs) : null;

  const tasks = taskWidgetItemsOnly;
  const tasksPending = tasks.filter((t) => !t.completed).length;
  const eventCount = (sortedEvents || []).length;
  const tomorrowTime = tomorrowFirstEvent?.start_time ? formatTime(tomorrowFirstEvent.start_time) : null;

  const currentProgressPct =
    currentBlock?.start_time && currentBlock?.end_time
      ? Math.min(100, Math.max(0,
          ((nowMs - new Date(currentBlock.start_time).getTime()) /
            (new Date(currentBlock.end_time).getTime() - new Date(currentBlock.start_time).getTime())) * 100
        ))
      : null;
  const timeRangeStr =
    currentBlock?.start_time && currentBlock?.end_time
      ? `${formatTime(currentBlock.start_time)} – ${formatTime(currentBlock.end_time)}`
      : null;
  const timeLeftStr = currentBlock?.end_time ? formatTimeLeft(currentBlock.end_time, nowMs) : null;

  // ── Timer session ──────────────────────────────────────────────────────────
  if (hasTimerSession) {
    const isBreak = timerMode === "break";
    const totalSecs = (isBreak ? breakTime || 5 : workTime || 25) * 60;
    const pct = Math.max(0, Math.min(100, ((totalSecs - Math.max(0, timeLeft)) / totalSecs) * 100));
    const fmt = (s) =>
      `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
    return (
      <div className={styles.root}>
        <SimpleHeader liveClock={liveClock} />
        <motion.div className={styles.timerBlock} {...fadeIn(0.07)}>
          <p className={styles.timerLabel}>
            {isBreak ? "BREAK" : "FOCUS"} · {timerTask || (isBreak ? "Break time" : "Focus session")} · {fmt(timeLeft)} left
          </p>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>
            Open timer →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Non-today ──────────────────────────────────────────────────────────────
  if (!isToday) {
    const firstEv = sortedEvents?.[0];
    return (
      <div className={styles.root}>
        <SimpleHeader liveClock={liveClock} />
        <motion.div {...fadeIn(0.07)}>
          {firstEv ? (
            <>
              <p className={styles.upNextTitle}>{firstEv.title}</p>
              {firstEv.start_time && <p className={styles.upNextDetails}>{formatTime(firstEv.start_time)}</p>}
            </>
          ) : (
            <p className={styles.nowEmpty}>No events for this day.</p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── End of day ─────────────────────────────────────────────────────────────
  if (nav.state === "endOfDay") {
    const completedCount = tasks.filter((t) => t.completed).length;
    const eventsToday = (sortedEvents || []).filter(
      (e) => e.start_time && new Date(e.start_time).getTime() < nowMs
    ).length;
    return (
      <div className={styles.root}>
        <SimpleHeader liveClock={liveClock} />
        <motion.div className={styles.endOfDayWrap} {...fadeIn(0.07)}>
          <div className={styles.endOfDayTopRow}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={26} strokeWidth={1.25} color="#C4A46D" aria-hidden />
            </motion.div>
            <div>
              <p className={styles.endOfDayTitle}>Day complete — nice work!</p>
              {(completedCount > 0 || eventsToday > 0) && (
                <p className={styles.endOfDaySub}>
                  {completedCount > 0 && `${completedCount}${tasks.length > 0 ? `/${tasks.length}` : ""} tasks`}
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
        </motion.div>
      </div>
    );
  }

  // ── Empty day ──────────────────────────────────────────────────────────────
  if (isToday && !currentBlock && !nextEvent && eventCount === 0) {
    return (
      <div className={styles.root}>
        <SimpleHeader liveClock={liveClock} />
        <motion.div className={styles.emptyDay} {...fadeIn(0.07)}>
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Sun size={30} strokeWidth={1.25} color="#C4A46D" aria-hidden />
          </motion.div>
          <p className={styles.emptyDayTitle}>Nothing planned today</p>
          <p className={styles.emptyDaySubtitle}>Enjoy your day</p>
          {tomorrowFirstEvent && tomorrowTime && (
            <p className={styles.emptyDayTomorrow}>
              Tomorrow: {tomorrowFirstEvent.title} at {tomorrowTime}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Main today view ────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {/* Header */}
      <WidgetHeader liveClock={liveClock} eventCount={eventCount} taskCount={tasksPending} />

      {/* Current event */}
      <AnimatePresence>
        {currentBlock?.title && (
          <ActiveEventCard
            key="current"
            currentBlock={currentBlock}
            timeRangeStr={timeRangeStr}
            timeLeftStr={timeLeftStr}
            currentProgressPct={currentProgressPct}
          />
        )}
      </AnimatePresence>

      {/* Up next / done */}
      <AnimatePresence mode="popLayout">
        {nextEvent ? (
          <motion.div key="upnext" className={styles.upNextRow} {...fadeIn(0.14)} layout>
            <div className={styles.upNextLeft}>
              <span className={styles.upNextLabel}>Next</span>
              <span className={styles.upNextTitle}>{nextEvent.title}</span>
            </div>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown.text}
                className={styles.upNextCountdown}
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
        ) : currentBlock ? (
          // In an event but nothing more scheduled — compact note
          <motion.div key="lastev" className={styles.lastEventRow} {...fadeIn(0.14)} layout>
            <CheckCircle size={13} strokeWidth={2} className={styles.lastEventIcon} aria-hidden />
            <span className={styles.lastEventText}>Last event of the day</span>
          </motion.div>
        ) : (
          // Truly free — no current and no next
          <motion.div key="free" className={styles.freeRow} {...fadeIn(0.14)} layout>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={22} strokeWidth={1.25} className={styles.freeIcon} aria-hidden />
            </motion.div>
            <div>
              <p className={styles.freePrimary}>You&apos;re done for the day</p>
              <p className={styles.freeSecondary}>No more events today</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TFL delay card — only when relevant */}
      <AnimatePresence>
        {showTfl && leaveByInfo && (
          <TflDelayCard key="tfl" leaveByInfo={leaveByInfo} relevantDelays={relevantDelays} />
        )}
      </AnimatePresence>

      {/* Conflicts */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <ConflictSummary key="conflicts" conflicts={conflicts} />
        )}
      </AnimatePresence>
    </div>
  );
}
