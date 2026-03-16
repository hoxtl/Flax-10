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
  isSevereDisruption,
} from "../utils/kclTflMapping";
import { Sun, Clock, AlertTriangle, Train, Sparkles, X, MapPinned, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatTime } from "../utils/dateFormatUtils";
import { useCountdown } from "../hooks/useCountdown";
import { isNow } from "../utils/eventUtils";
import { tflService } from "../../../api/tflService";
import { getHomeAddress } from "../../../api/userService";
import { resolveCampusFromText } from "../../../lib/kclCampuses";
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

function getJourneySummary(journey) {
  if (!journey) return null;
  const lines = journey.legs
    ?.flatMap((leg) => leg.routeOptions?.map((option) => option.name).filter(Boolean) || [])
    ?.filter(Boolean);
  const uniqueLines = [...new Set(lines)];
  return {
    duration: Number.isFinite(journey.duration) ? `${journey.duration} min` : null,
    mode: journey.legs?.[0]?.mode ? journey.legs[0].mode.replace(/_/g, " ") : "journey",
    lines: uniqueLines.slice(0, 3),
  };
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
  const primary = relevantDelays[0];
  const lineName = primary?.lineName || "TfL";
  const severity = primary?.severityDescription || "Delays";
  const hasSevere = relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
  const bufferMins = 35 + (hasSevere ? 20 : 10);
  const leaveByMs = startMs - bufferMins * 60000;
  const minsUntilLeave = Math.floor((leaveByMs - nowMs) / 60000);
  const leaveByStr = new Date(leaveByMs).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (nowMs >= leaveByMs) {
    return {
      urgency: "critical",
      lineName,
      severity,
      message: `${lineName} Line: ${severity} — leave now for ${nextEvent.title}`,
      leaveByStr,
      hasSevere,
    };
  }
  if (minsUntilLeave <= 15) {
    return {
      urgency: "urgent",
      lineName,
      severity,
      message: `${lineName} Line: ${severity} — leave in ${minsUntilLeave}m for ${nextEvent.title}`,
      leaveByStr,
      hasSevere,
    };
  }
  return {
    urgency: "info",
    lineName,
    severity,
    message: `${lineName} Line: ${severity} — leave by ${leaveByStr} for ${nextEvent.title}`,
    leaveByStr,
    hasSevere,
  };
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

function WidgetHeader({ eventCount, taskCount }) {
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

function TflDelayCard({ leaveByInfo, onDismiss }) {
  return (
    <motion.div
      className={styles.alertPill}
      {...fadeIn(0.14)}
      layout
    >
      <Train size={13} strokeWidth={2} className={styles.alertIcon} aria-hidden />
      <span className={styles.alertText}>{leaveByInfo.message}</span>
      <button type="button" className={styles.alertDismiss} onClick={onDismiss} aria-label="Dismiss delay alert">
        <X size={12} strokeWidth={2} />
      </button>
    </motion.div>
  );
}

function ConflictSummary({ conflicts, onDismiss }) {
  const count = conflicts.length || 0;
  const first = conflicts[0];
  const overlapTime = first?.a?.start_time
    ? new Date(first.a.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  const label = overlapTime
    ? `Warning: Schedule overlap at ${overlapTime}`
    : `${count} schedule overlap${count === 1 ? "" : "s"} today`;
  return (
    <motion.div className={styles.alertPill} {...fadeIn(0.12)}>
      <AlertTriangle size={12} strokeWidth={2} className={styles.alertIconWarn} aria-hidden />
      <span className={styles.alertTextWarn}>{label}</span>
      <button type="button" className={styles.alertDismiss} onClick={onDismiss} aria-label="Dismiss warning">
        <X size={12} strokeWidth={2} />
      </button>
    </motion.div>
  );
}

function CommuteContextCard({ campus, journey, loading, leaveByInfo }) {
  const summary = getJourneySummary(journey);
  const lead = leaveByInfo?.leaveByStr
    ? `Leave by ${leaveByInfo.leaveByStr}`
    : summary?.duration
      ? `${summary.duration} from home`
      : "Check travel";

  return (
    <motion.div className={styles.contextCard} {...fadeIn(0.22)}>
      <div className={styles.contextCardHeader}>
        <div className={styles.contextCardTitleRow}>
          <MapPinned size={14} strokeWidth={1.8} className={styles.contextCardIcon} aria-hidden />
          <span className={styles.contextCardEyebrow}>Travel context</span>
        </div>
        <Link to="/map" className={styles.contextCardLink}>
          Open map
          <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
      <p className={styles.contextCardTitle}>
        {campus ? `${campus.shortName} commute` : "Campus commute"}
      </p>
      <p className={styles.contextCardText}>
        {loading
          ? "Checking route and TfL context for your next campus event…"
          : `${lead}${campus ? ` for ${campus.name}` : ""}.`}
      </p>
      {!loading && summary?.lines?.length > 0 && (
        <div className={styles.contextPills}>
          {summary.lines.map((line) => (
            <span key={line} className={styles.contextPill}>{line}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Shared header for early-return views ───────────────────────────────────

function SimpleHeader() {
  return (
    <motion.div className={styles.widgetHeader} {...fadeIn(0)}>
      <div className={styles.headerIconWrap}>
        <Clock size={15} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
      </div>
      <span className={styles.headerLabel}>Right Now</span>
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
  const [showConflictAlert, setShowConflictAlert] = useState(true);
  const [showTflAlert, setShowTflAlert] = useState(true);
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loadingCommute, setLoadingCommute] = useState(false);

  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], now);
  const nextEvent = nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], now);
  const nextEventTarget = nextEvent?.start_time ? new Date(nextEvent.start_time) : null;
  const countdown = useCountdown(nextEventTarget);
  const conflicts = Array.isArray(nav.overlaps) ? nav.overlaps : [];

  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const hasCampus = hasCampusCommute(nextEvent);
  const showTfl = relevantDelays.length > 0 && hasCampus && nextEvent;
  const leaveByInfo = showTfl ? getLeaveByInfo(nextEvent, relevantDelays, nowMs) : null;
  const nextCampus = resolveCampusFromText(nextEvent?.location || nextEvent?.title || "");

  useEffect(() => {
    let cancelled = false;
    async function loadCommute() {
      if (!isToday || !nextCampus || !nextEvent?.start_time) {
        setCommuteInfo(null);
        return;
      }
      setLoadingCommute(true);
      try {
        const home = await getHomeAddress();
        const lat = Number(home?.home_latitude);
        const lng = Number(home?.home_longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          if (!cancelled) setCommuteInfo(null);
          return;
        }
        const journey = await tflService.journeyPlanner(lat, lng, nextCampus.coords[1], nextCampus.coords[0]);
        if (!cancelled) setCommuteInfo(journey || null);
      } catch (_) {
        if (!cancelled) setCommuteInfo(null);
      } finally {
        if (!cancelled) setLoadingCommute(false);
      }
    }
    loadCommute();
    return () => {
      cancelled = true;
    };
  }, [isToday, nextCampus, nextEvent?.start_time]);

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
      <WidgetHeader eventCount={eventCount} taskCount={tasksPending} />

      <AnimatePresence>
        {showConflictAlert && conflicts.length > 0 && (
          <ConflictSummary key="conflicts" conflicts={conflicts} onDismiss={() => setShowConflictAlert(false)} />
        )}
      </AnimatePresence>

      {/* TFL delay advice */}
      <AnimatePresence>
        {showTflAlert && showTfl && leaveByInfo && (
          <TflDelayCard key="tfl" leaveByInfo={leaveByInfo} onDismiss={() => setShowTflAlert(false)} />
        )}
      </AnimatePresence>

      {currentBlock ? (
        <ActiveEventCard
          currentBlock={currentBlock}
          timeRangeStr={timeRangeStr}
          timeLeftStr={timeLeftStr}
          currentProgressPct={currentProgressPct}
        />
      ) : (
        <motion.div className={styles.nowLine} {...fadeIn(0.16)}>
          <span className={styles.nowPill}>Now</span>
          <span className={styles.nowText}>
            Nothing on right now
          </span>
        </motion.div>
      )}

      <motion.div className={styles.upNextRow} {...fadeIn(0.2)}>
        <div className={styles.upNextLeft}>
          <span className={styles.upNextLabel}>Up next</span>
        </div>
        {nextEvent ? (
          <div className={styles.nextBlock}>
            <span className={styles.nextTitle}>{nextEvent.title}</span>
            <span className={styles.nextMeta}>
              at {formatTime(nextEvent.start_time)}
              {countdown.text ? ` · ${countdown.text}` : ""}
              {nextEvent.location ? ` · ${nextEvent.location}` : ""}
            </span>
          </div>
        ) : (
          <span className={styles.nextTitle}>No more events today</span>
        )}
      </motion.div>

      {(nextCampus || loadingCommute) && (
        <CommuteContextCard
          campus={nextCampus}
          journey={commuteInfo}
          loading={loadingCommute}
          leaveByInfo={leaveByInfo}
        />
      )}

    </div>
  );
}
