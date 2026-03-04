/**
 * RIGHT NOW widget — answers "What do I need to know RIGHT NOW to stay on time?"
 * Sections: Header (pulsing dot + live clock), Current event, Up next, Travel, Overlap warning.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRelevantDelays,
  getTflLineColor,
  getTflLinesForLocation,
  getTflLinePillStyle,
  isSevereDisruption,
} from "../utils/kclTflMapping";
import { getContextualTravelAlert, getTravelSeverity, TRAVEL_SEVERITY, getSeverityDotColor } from "../utils/contextualTravelAlert";
import { Sun, AlertCircle, Clock, CheckCircle, CheckCircle2, MapPin, AlertTriangle, AlertOctagon, Car, Train, Coffee, Sparkles } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import { useCountdown } from "../hooks/useCountdown";
import { isNow, extractModuleCode, spinePillBorderColor } from "../utils";
import { ModulePill, TypePill } from "./ModulePill";
import styles from "./RightNowWidget.module.css";

/** Minutes left until event end — for time-left badge colour band. */
function getTimeLeftBand(minutesLeft) {
  if (minutesLeft == null || minutesLeft < 0) return "over";
  if (minutesLeft < 10) return "under10";
  if (minutesLeft < 30) return "10to30";
  return "over30";
}

function ActiveEventCard({
  currentBlock,
  timeRangeStr,
  timeLeftStr,
  currentProgressPct,
  nowMs,
  now,
}) {
  const categoryColor = spinePillBorderColor(currentBlock) || "#8B7355";
  const moduleCode = extractModuleCode(currentBlock.title) || extractModuleCode(currentBlock.description) || currentBlock.module_code || "";
  const tagName = currentBlock.tag_name ?? currentBlock.tag_details?.name ?? currentBlock.tag?.name ?? "";
  const typeLabel = tagName ? String(tagName).trim() : null;

  const minutesLeft =
    currentBlock?.end_time != null
      ? Math.max(0, Math.floor((new Date(currentBlock.end_time).getTime() - nowMs) / 60000))
      : null;
  const band = getTimeLeftBand(minutesLeft);

  const badgeStyle =
    band === "over30"
      ? { bg: "#F0EBE3", color: "#8B7355" }
      : band === "10to30"
        ? { bg: "#FEF3E2", color: "#D4850A" }
        : { bg: "#FEE9E9", color: "#DC3545" };

  const liveTimeStr = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

  return (
    <div
      className={styles.currentEventCard}
      style={{ borderLeftColor: categoryColor }}
    >
      <div className={styles.currentEventStatusRow}>
        <div className={styles.currentEventDotWrap}>
          <motion.div
            className={styles.currentEventDotPulse}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className={styles.currentEventDotInner} />
        </div>
        <span className={styles.currentEventNowLabel}>Right Now</span>
        <span className={styles.currentEventStatusRight}>
          {liveTimeStr && <span className={styles.currentEventTimestamp}>{liveTimeStr}</span>}
          {timeLeftStr && (
            <motion.span
              className={`${styles.currentEventBadgePill} ${styles[`currentEventBadgePill_${band}`]}`}
              animate={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {timeLeftStr}
            </motion.span>
          )}
        </span>
      </div>

      <div className={styles.currentEventTitleRow}>
        <h3 className={styles.currentEventCardTitle}>{currentBlock.title}</h3>
        <span className={styles.currentEventPillsWrap}>
          {moduleCode && <ModulePill moduleCode={moduleCode} className={styles.currentEventPill} />}
          {typeLabel && <TypePill typeLabel={typeLabel} accentColor={categoryColor} className={styles.currentEventTypePill} />}
        </span>
      </div>

      <div className={styles.currentEventDetailsRow}>
        {timeRangeStr && <span className={styles.currentEventTimeRange}>{timeRangeStr}</span>}
        {timeRangeStr && currentBlock.location?.trim() && <span className={styles.currentEventSep}>|</span>}
        {currentBlock.location?.trim() && (
          <span className={styles.currentEventLocationWrap}>
            <MapPin size={13} strokeWidth={1.75} className={styles.currentEventLocationIcon} aria-hidden />
            {currentBlock.location.trim()}
          </span>
        )}
      </div>

      {currentProgressPct != null && (
        <div className={styles.currentEventProgressWrap}>
          <div className={styles.currentEventProgressTrack}>
            <motion.div
              className={styles.currentEventProgressFill}
              initial={{ width: "0%" }}
              animate={{ width: `${currentProgressPct}%` }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ background: categoryColor }}
            />
            <span
              className={styles.currentEventProgressPlayhead}
              style={{
                left: `${currentProgressPct}%`,
                borderColor: categoryColor,
              }}
            />
          </div>
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
  savedRoutes = [],
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
  actionHubItemsOnly = [],
}) {
  const tasks = taskWidgetItemsOnly.length ? taskWidgetItemsOnly : actionHubItemsOnly;
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
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          <span className={styles.headerLabel}>RIGHT NOW</span>
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
            <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
            <span className={styles.headerLabel}>RIGHT NOW</span>
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
          <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          <span className={styles.headerLabel}>RIGHT NOW</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={`${styles.section} ${styles.sectionFirst} ${styles.sectionLast}`}>
          <p className={styles.upNextTitle}>{firstEv.title}</p>
          {firstTime && <p className={styles.upNextDetails}>{firstTime}</p>}
        </div>
      </motion.div>
    );
  }

  // --- End of day ---
  if (nav.state === "endOfDay") {
    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;
    const eventsToday = (sortedEvents || []).filter(
      (e) => e.start_time && new Date(e.start_time).getTime() < nowMs
    ).length;
    const tomorrowTime = tomorrowFirstEvent?.start_time ? formatTime(tomorrowFirstEvent.start_time) : null;
    return (
      <motion.div
        initial={containerMotion.initial}
        animate={containerMotion.animate}
        transition={containerMotion.transition}
        className={styles.root}
      >
        <div className={styles.widgetHeader}>
          <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          <span className={styles.headerLabel}>RIGHT NOW</span>
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
      </motion.div>
    );
  }

  // --- Countdown from useCountdown (updates every 60s, or 1s when < 5min) ---
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

  // Contextual travel alert (single source for headline/leaveBy when using savedRoutes)
  const contextualAlert =
    nextEvent && tflDelays
      ? getContextualTravelAlert(nextEvent, tflDelays, {
          savedRoutes: Array.isArray(savedRoutes) ? savedRoutes : [],
          leaveEarlyMinutes: leaveMins,
        })
      : null;
  const travelHeadline = contextualAlert?.hasRelevantAlert ? contextualAlert.headline : bannerTitle;
  const travelLeaveBy = contextualAlert?.hasRelevantAlert ? contextualAlert.leaveBy : null;

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
          <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          <span className={styles.headerLabel}>RIGHT NOW</span>
          <span className={styles.headerClock}>{liveClock}</span>
        </div>
        <div className={styles.emptyDay}>
          <p className={styles.emptyDayTitle}>
            <CheckCircle size={18} className={styles.emptyDayIcon} aria-hidden /> Your day is clear
          </p>
          <p className={styles.emptyDaySubtitle}>No events scheduled</p>
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
          <Clock size={16} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          <span className={styles.headerLabel}>RIGHT NOW</span>
          {hasActiveEvent && (
            <span className={`${styles.headerDot} ${styles.headerDotActive}`} aria-hidden />
          )}
          <span className={styles.headerClock}>{liveClock}</span>
        </motion.div>

      {/* Current event section — active event card */}
      <motion.div
        className={`${styles.section} ${styles.sectionFirst} ${styles.sectionCurrent}`}
        variants={staggerChildVariants}
      >
        {currentBlock?.title ? (
          <ActiveEventCard
            currentBlock={currentBlock}
            timeRangeStr={timeRangeStr}
            timeLeftStr={timeLeftStr}
            currentProgressPct={currentProgressPct}
            nowMs={nowMs}
            now={now}
          />
        ) : (
          <div className={styles.nowEmptyRow}>
            <motion.div
              className={styles.nowEmptyIconWrap}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Coffee size={28} strokeWidth={1.25} className={styles.nowEmptyIconRelaxed} aria-hidden />
            </motion.div>
            <div className={styles.nowEmptyTextWrap}>
              <p className={styles.nowEmptyPrimary}>You're free right now</p>
              <p className={styles.nowEmptySecondary}>
                {nextEvent && eventTimeStr ? `Nothing until ${eventTimeStr}` : "Nothing on right now"}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Divider */}
      <motion.div className={styles.sectionDivider} aria-hidden variants={staggerChildVariants} />

      {/* Up next section */}
      <motion.div className={styles.section} variants={staggerChildVariants}>
        {nextEvent ? (
          <motion.div
            className={styles.upNextCardBox}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={styles.upNextCardLeft}>
              <p className={styles.upNextCardLabel}>UP NEXT</p>
              <p className={styles.upNextCardTitle}>{nextEvent.title}</p>
              <div className={styles.upNextMetaRow}>
                {eventTimeStr && <span className={styles.upNextMetaTime}>{eventTimeStr}</span>}
                {(extractModuleCode(nextEvent.title) || nextEvent.module_code) && (
                  <ModulePill
                    moduleCode={extractModuleCode(nextEvent.title) || nextEvent.module_code || ""}
                    className={styles.upNextMetaPill}
                  />
                )}
                {nextEvent.location?.trim() && (
                  <>
                    {eventTimeStr && <span className={styles.upNextMetaSep}>·</span>}
                    <span className={styles.upNextMetaLocation}>{nextEvent.location.trim()}</span>
                  </>
                )}
              </div>
            </div>
            {countdown.text && (
              <span
                className={
                  countdown.urgency === "urgent"
                    ? styles.upNextCountdownPill_under10
                    : countdown.urgency === "soon"
                      ? styles.upNextCountdownPill_10to30
                      : styles.upNextCountdownPill_over30
                }
              >
                {countdown.urgency === "urgent" && <AlertCircle size={14} className={styles.countdownIconUrgent} aria-hidden />}
                {countdown.urgency === "soon" && <Clock size={14} className={styles.countdownIconWarning} aria-hidden />}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={countdown.text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className={styles.upNextCountdownText}
                  >
                    {countdown.text}
                  </motion.span>
                </AnimatePresence>
              </span>
            )}
          </motion.div>
        ) : (
          <div className={styles.nowEmptyRow}>
            <motion.div
              className={styles.nowEmptyIconWrap}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={28} strokeWidth={1.25} className={styles.nowEmptyIconRelaxed} aria-hidden />
            </motion.div>
            <div className={styles.nowEmptyTextWrap}>
              <p className={styles.nowEmptyPrimary}>You're done for the day</p>
              <p className={styles.nowEmptySecondary}>No more events today</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* TfL / Commute status section */}
      <motion.div className={styles.sectionTravelWrap} variants={staggerChildVariants}>
        <div className={styles.travelDivider} aria-hidden />
        <div className={styles.commuteStatusRow}>
          <span className={styles.commuteLabel}>
            <Train size={16} strokeWidth={2} className={styles.commuteLabelIcon} aria-hidden />
            COMMUTE
          </span>
          <span className={styles.commuteStatusSummary}>
            <span
              className={styles.commuteStatusDot}
              style={{
                background:
                  tflDelays === undefined
                    ? "#B8A890"
                    : hasRelevantDelays && nextEvent
                      ? getSeverityDotColor(contextualAlert?.severity)
                      : "#22C55E",
              }}
              aria-hidden
            />
            {tflDelays === undefined ? "Checking…" : hasRelevantDelays && nextEvent ? "Delays" : "All clear"}
          </span>
        </div>

        {tflDelays === undefined ? (
          <div className={styles.travelRow}>
            <Car size={16} className={styles.travelIcon} aria-hidden />
            <span className={styles.travelText}>Checking travel…</span>
          </div>
        ) : nextEvent && !hasCampus ? (
          <motion.div
            className={styles.commuteInline}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CheckCircle2 size={14} className={styles.commuteInlineIcon} aria-hidden />
            <span>No campus commute coming up</span>
          </motion.div>
        ) : hasRelevantDelays ? (
          (() => {
            const severity = getTravelSeverity(relevantDelays);
            const isSevere = severity === TRAVEL_SEVERITY.SEVERE || severity === TRAVEL_SEVERITY.SUSPENDED;
            const firstLine = relevantDelays[0]?.lineName || "Line";
            if (isSevere) {
              return (
                <motion.div
                  className={styles.commuteCardSevere}
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
                  role="alert"
                >
                  <div className={styles.commuteCardHead}>
                    <AlertOctagon size={14} className={styles.commuteCardIconSevere} aria-hidden />
                    <span>
                      {severity === TRAVEL_SEVERITY.SUSPENDED
                        ? `${firstLine} Line suspended`
                        : `Severe delays on ${firstLine} Line`}
                    </span>
                  </div>
                  <p className={styles.commuteCardRec}>{contextualAlert?.recommendation}</p>
                  {contextualAlert?.leaveBy && (
                    <span className={styles.commuteLeaveByBadgeSevere}>
                      Leave by {contextualAlert.leaveBy}
                    </span>
                  )}
                </motion.div>
              );
            }
            return (
              <motion.div
                className={styles.commuteCardMinor}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                role="alert"
              >
                <div className={styles.commuteCardHeadMinor}>
                  <AlertTriangle size={14} className={styles.commuteCardIconMinor} aria-hidden />
                  <span>Minor delays on {firstLine} Line</span>
                </div>
                <div className={styles.commuteLinePills}>
                  {relevantDelays.map((d, i) => {
                    const pill = getTflLinePillStyle(d.lineName);
                    return (
                      <span
                        key={i}
                        className={styles.commuteLinePill}
                        style={{ background: pill.bg, color: pill.text }}
                      >
                        {d.lineName}
                      </span>
                    );
                  })}
                </div>
                <p className={styles.commuteCardRec}>
                  Leave ~{leaveMins} mins early — aim for {contextualAlert?.leaveBy} for your {eventTimeStr} {nextEvent.title}
                </p>
                {contextualAlert?.leaveBy && (
                  <span className={styles.commuteLeaveByBadge}>
                    Leave by {contextualAlert.leaveBy}
                  </span>
                )}
              </motion.div>
            );
          })()
        ) : nextEvent && hasCampus ? (
          <motion.div
            className={styles.commuteCardGood}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CheckCircle size={14} className={styles.commuteCardIconGood} aria-hidden />
            <span>
              {(() => {
                const locLines = getTflLinesForLocation(nextEvent.location || "");
                const titleLines = getTflLinesForLocation(nextEvent.title || "");
                const names = [...new Set([...locLines, ...titleLines])];
                const lineLabel = names.length > 1 ? `${names[0]} & ${names[1]}` : names[0] || "Lines";
                const leaveBy = nextEvent.start_time
                  ? new Date(new Date(nextEvent.start_time).getTime() - leaveMins * 60000).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
                  : "";
                return leaveBy
                  ? `${lineLabel} running fine — leave by ${leaveBy} for your `
                  : `${lineLabel} running fine`;
              })()}
            </span>
            {nextEvent.title ? <strong>{eventTimeStr} {nextEvent.title}</strong> : eventTimeStr ? <strong>{eventTimeStr}</strong> : null}
          </motion.div>
        ) : hasAnyDelays && !hasRelevantDelays ? (
          <motion.div
            className={styles.commuteInline}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CheckCircle2 size={14} className={styles.commuteInlineIcon} aria-hidden />
            <span>Your commute looks clear</span>
          </motion.div>
        ) : null}

        {!hasRelevantDelays && hasAnyDelays && nonRelevantDelays.length > 0 && (
          <>
            <button
              type="button"
              className={styles.otherLinesToggle}
              onClick={() => setOtherLinesExpanded((e) => !e)}
            >
              {otherLinesExpanded ? "Show less" : `${nonRelevantDelays.length} other line${nonRelevantDelays.length !== 1 ? "s" : ""} affected`}
            </button>
            <div className={`${styles.otherLinesExpandWrap} ${otherLinesExpanded ? styles.otherLinesExpanded : ""}`}>
              <div className={styles.tflLineList}>
                {nonRelevantDelays.map((d, i) => (
                  <div key={i} className={styles.tflLineRow}>
                    <span className={styles.tflDot} style={{ background: getTflLineColor(d.lineName) }} aria-hidden />
                    <span>{d.lineName}</span>
                    <span className={styles.tflStatus}>· {d.severityDescription}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!nextEvent && tflDelays && tflDelays.length === 0 && (
          <motion.div className={styles.commuteInline} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <CheckCircle2 size={14} className={styles.commuteInlineIcon} aria-hidden />
            <span>All lines running normally</span>
          </motion.div>
        )}
      </motion.div>

      {/* Overlap warning */}
      {Array.isArray(conflicts) && conflicts.length > 0 && (
        <motion.div
          className={styles.section}
          variants={staggerChildVariants}
        >
          {conflicts.map((c, idx) => {
            const aTitle = c.a?.title || "Event A";
            const bTitle = c.b?.title || "Event B";
            const eventNames = [aTitle, bTitle].filter(Boolean).join(" & ");
            return (
              <div key={idx} className={styles.conflictRowNew} role="alert">
                <AlertTriangle size={15} strokeWidth={2} className={styles.conflictIconNew} aria-hidden />
                <span className={styles.conflictTextNew}>
                  <span className={styles.conflictLabel}>Overlap</span>
                  <span className={styles.conflictSep}> — </span>
                  <span
                    className={styles.conflictEventName}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                  >
                    {eventNames}
                  </span>
                </span>
              </div>
            );
          })}
        </motion.div>
      )}
      </motion.div>
    </motion.div>
  );
}
