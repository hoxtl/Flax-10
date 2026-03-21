/**
 * Right Now widget shell.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Clock, Sparkles, Sun } from "lucide-react";
import SharedWidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import LocationLink from "../../../components/common/location_link/LocationLink";
import { formatTime } from "../utils/dateFormatUtils";
<<<<<<< HEAD
import { useRightNowData } from "../hooks/useRightNowData";
import {
  ActiveEventCard,
  CommuteContextCard,
  ConflictSummary,
  TflDelayCard,
  fadeIn,
} from "./RightNowSubComponents";
import {
  buildAlertState,
  buildRightNowDataProps,
  buildRightNowViewProps,
  buildTimerSessionViewModel,
  buildTodayHeaderMeta,
  buildTodayViewModel,
  buildViewContext,
  buildWidgetProps,
  formatTimerLabel,
  timerProgress,
} from "./rightNowWidget.viewmodel.js";
=======
import { useCountdown } from "../hooks/useCountdown";
import { isNow } from "../utils/eventUtils";
import { tflService } from "../../../api/tflApi";
import { getHomeAddress } from "../../../api/userApi";
import { resolveCampusFromText } from "../../../lib/kclCampuses";
import baseStyles from "../styles/WidgetBase.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "./RightNowWidget.module.css";

function useLiveClock() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  useEffect(() => {
    const id = setInterval(
<<<<<<< HEAD
      () =>
        setClock(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ),
      1000,
=======
      () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      1000
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    );
    return () => clearInterval(id);
  }, []);

  return clock;
}

<<<<<<< HEAD
function StatusHeader({ liveClock, label = "Right Now" }) {
  return (
    <Motion.div {...fadeIn(0)}>
      <SharedWidgetHeader icon={Clock} title={label} meta={liveClock} />
    </Motion.div>
  );
=======
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
      message: <><b>{lineName} Line</b>: {severity} — leave <b>now</b> for {nextEvent.title}</>,
      leaveByStr,
      hasSevere,
    };
  }
  if (minsUntilLeave <= 15) {
    return {
      urgency: "urgent",
      lineName,
      severity,
      message: <><b>{lineName} Line</b>: {severity} — leave in <b>{minsUntilLeave}m</b> for {nextEvent.title}</>,
      leaveByStr,
      hasSevere,
    };
  }
  return {
    urgency: "info",
    lineName,
    severity,
    message: <><b>{lineName} Line</b>: {severity} — leave by <b>{leaveByStr}</b> for {nextEvent.title}</>,
    leaveByStr,
    hasSevere,
  };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function WidgetHeader({ eventCount, taskCount }) {
  const meta = buildTodayHeaderMeta(eventCount, taskCount);
  return (
<<<<<<< HEAD
    <Motion.div {...fadeIn(0)}>
      <SharedWidgetHeader icon={Clock} title="Right Now" meta={meta || null} />
    </Motion.div>
  );
}

function TimerSessionCard(props) {
  const vm = buildTimerSessionViewModel(props);
=======
    <motion.div className={baseStyles.widgetHeader} {...fadeIn(0)}>
      <div className={baseStyles.headerIconWrap}>
        <Clock size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
      </div>
      <span className={baseStyles.headerTitle}>Right Now</span>
      <span className={baseStyles.headerMeta}>
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
    band === "under10" ? "var(--home-urgency-danger)" : band === "10to30" ? "var(--home-urgency-warning)" : "var(--sage)";

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return (
    <>
      <StatusHeader liveClock={vm.liveClock} />
      <TimerClock timeLeft={vm.timeLeft} isBreak={vm.isBreak} timerTask={vm.timerTask} />
      <TimerControls pct={vm.progressPct} onOpenTimer={vm.onOpenTimer} />
    </>
  );
}

function TimerClock({ timeLeft, isBreak, timerTask }) {
  return (
    <Motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{formatTimerLabel(timeLeft)}</span>
      <span className={styles.clockLabel}>{isBreak ? "Break" : "Focus"} · {timerTask || (isBreak ? "Break time" : "Focus session")}</span>
    </Motion.div>
  );
}

function TimerControls({ pct, onOpenTimer }) {
  return (
    <Motion.div className={styles.timerBlock} {...fadeIn(0.07)}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>
        Open timer →
      </button>
    </Motion.div>
  );
}

<<<<<<< HEAD
function NonTodayCard({ liveClock, firstEvent }) {
  return (
    <>
      <StatusHeader liveClock={liveClock} />
      <Motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
        <span className={styles.clockTime}>{liveClock}</span>
        <span className={styles.clockLabel}>Not today's view</span>
      </Motion.div>
      <Motion.div {...fadeIn(0.1)}>
        {firstEvent ? <EventPreview event={firstEvent} /> : <p className={styles.nowEmpty}>No events for this day.</p>}
      </Motion.div>
    </>
  );
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function EventPreview({ event }) {
  return (
    <>
      <p className={styles.upNextTitle}>{event.title}</p>
      {event.start_time && (
        <p className={styles.upNextDetails}>
          {formatTime(event.start_time)}
          <EventLocationMeta location={event.location} />
        </p>
      )}
    </>
  );
}

<<<<<<< HEAD
function EndOfDayCard({ liveClock, completedCount, tasksLength, eventsToday, tomorrowFirstEvent, tomorrowTime }) {
  return (
    <>
      <StatusHeader liveClock={liveClock} />
      <Motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
        <span className={styles.clockTime}>{liveClock}</span>
        <span className={styles.clockLabel}>End of day</span>
      </Motion.div>
      <Motion.div className={styles.endOfDayWrap} {...fadeIn(0.07)}>
        <EndOfDaySummary completedCount={completedCount} tasksLength={tasksLength} eventsToday={eventsToday} />
        {tomorrowFirstEvent && <TomorrowSection event={tomorrowFirstEvent} time={tomorrowTime} />}
      </Motion.div>
    </>
  );
}

function EndOfDaySummary({ completedCount, tasksLength, eventsToday }) {
  return (
    <div className={styles.endOfDayTopRow}>
      <Motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <Sparkles size={22} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
      </Motion.div>
      <div>
        <p className={styles.endOfDayTitle}>Day complete — nice work!</p>
        <p className={styles.endOfDaySub}>
          {completedCount > 0 && `${completedCount}${tasksLength > 0 ? `/${tasksLength}` : ""} tasks`}
          {completedCount > 0 && eventsToday > 0 && " · "}
          {eventsToday > 0 && `${eventsToday} event${eventsToday !== 1 ? "s" : ""} attended`}
        </p>
      </div>
=======
// ─── Shared header for early-return views ───────────────────────────────────

function SimpleHeader({ liveClock }) {
  return (
    <motion.div className={baseStyles.widgetHeader} {...fadeIn(0)}>
      <div className={baseStyles.headerIconWrap}>
        <Clock size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
      </div>
      <span className={baseStyles.headerTitle}>Right Now</span>
      {liveClock && <span className={baseStyles.headerMeta}>{liveClock}</span>}
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
  const safeNow = (now instanceof Date && !isNaN(now)) ? now : new Date();
  const nowMs = safeNow.getTime();
  const liveClock = useLiveClock();
  const [showConflictAlert, setShowConflictAlert] = useState(true);
  const [showTflAlert, setShowTflAlert] = useState(true);
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loadingCommute, setLoadingCommute] = useState(false);

  const currentBlock = nav.currentBlock ?? nav.current ?? getCurrentBlock(sortedEvents || [], safeNow);
  const nextEvent = nav.nextItem ?? nav.next ?? getNextEvent(sortedEvents || [], safeNow);
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
        <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
          <span className={styles.clockTime}>{fmt(timeLeft)}</span>
          <span className={styles.clockLabel}>{isBreak ? "Break" : "Focus"} · {timerTask || (isBreak ? "Break time" : "Focus session")}</span>
        </motion.div>
        <motion.div className={styles.timerBlock} {...fadeIn(0.07)}>
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
        <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
          <span className={styles.clockTime}>{liveClock}</span>
          <span className={styles.clockLabel}>Not today's view</span>
        </motion.div>
        <motion.div {...fadeIn(0.1)}>
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
        <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
          <span className={styles.clockTime}>{liveClock}</span>
          <span className={styles.clockLabel}>End of day</span>
        </motion.div>
        <motion.div className={styles.endOfDayWrap} {...fadeIn(0.07)}>
          <div className={styles.endOfDayTopRow}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={22} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
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
            <div className={styles.tomorrowSection}>
              <p className={styles.tomorrowLabel}>Tomorrow</p>
              <p className={styles.tomorrowFirstTitle}>{tomorrowFirstEvent.title}</p>
              {tomorrowTime && <p className={styles.tomorrowFirstTime}>at {tomorrowTime}</p>}
            </div>
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
        <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
          <span className={styles.clockTime}>{liveClock}</span>
          <span className={styles.clockLabel}>Nothing scheduled today</span>
        </motion.div>
        <motion.div className={styles.emptyDay} {...fadeIn(0.1)}>
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Sun size={28} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
          </motion.div>
          <p className={styles.emptyDayTitle}>Free day — enjoy it!</p>
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

      {/* Live clock prominently in header meta via WidgetHeader - also show in top area */}
      <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
        <span className={styles.clockTime}>{liveClock}</span>
        <span className={styles.clockLabel}>
          {currentBlock ? "In session" : nextEvent ? "Up next" : "Free now"}
        </span>
      </motion.div>

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

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

function TomorrowSection({ event, time }) {
  return (
    <div className={styles.tomorrowSection}>
      <p className={styles.tomorrowLabel}>Tomorrow</p>
      <p className={styles.tomorrowFirstTitle}>{event.title}</p>
      {time && <p className={styles.tomorrowFirstTime}>at {time}</p>}
    </div>
  );
}

function EmptyDayCard({ liveClock, tomorrowFirstEvent, tomorrowTime }) {
  return (
    <>
      <StatusHeader liveClock={liveClock} label="Right Now" />
      <EmptyClock liveClock={liveClock} />
      <EmptyBody tomorrowFirstEvent={tomorrowFirstEvent} tomorrowTime={tomorrowTime} />
    </>
  );
}

function EmptyClock({ liveClock }) {
  return (
    <Motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{liveClock}</span>
      <span className={styles.clockLabel}>Nothing scheduled today</span>
    </Motion.div>
  );
}

function EmptyBody({ tomorrowFirstEvent, tomorrowTime }) {
  return (
    <Motion.div className={styles.emptyDay} {...fadeIn(0.1)}>
      <Motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Sun size={28} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
      </Motion.div>
      <p className={styles.emptyDayTitle}>Free day — enjoy it!</p>
      {tomorrowFirstEvent && tomorrowTime && <p className={styles.emptyDayTomorrow}>Tomorrow: {tomorrowFirstEvent.title} at {tomorrowTime}</p>}
    </Motion.div>
  );
}

function TodayAlerts({ conflicts, leaveByInfo, showConflictAlert, showTflAlert, setShowConflictAlert, setShowTflAlert, showTfl }) {
  const vm = buildAlertState({ showConflictAlert, showTflAlert, showTfl, leaveByInfo });
  return (
    <>
      <ConflictAlert enabled={vm.showConflicts} conflicts={conflicts} onDismiss={vm.onDismissConflict(setShowConflictAlert)} />
      <TflAlert enabled={vm.showTflAlert} leaveByInfo={leaveByInfo} onDismiss={vm.onDismissTfl(setShowTflAlert)} />
    </>
  );
}

function ConflictAlert({ enabled, conflicts, onDismiss }) {
  return <AnimatePresence>{enabled && conflicts.length > 0 && <ConflictSummary key="conflicts" conflicts={conflicts} onDismiss={onDismiss} />}</AnimatePresence>;
}

function TflAlert({ enabled, leaveByInfo, onDismiss }) {
  return <AnimatePresence>{enabled && leaveByInfo && <TflDelayCard key="tfl" leaveByInfo={leaveByInfo} onDismiss={onDismiss} />}</AnimatePresence>;
}

function TodayClock({ liveClock, label }) {
  return (
    <Motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{liveClock}</span>
      <span className={styles.clockLabel}>{label}</span>
    </Motion.div>
  );
}

function TodayCurrentState({ currentBlock, currentProgressPct, timeRangeStr, timeLeftStr }) {
  if (currentBlock) {
    return <ActiveEventCard currentBlock={currentBlock} timeRangeStr={timeRangeStr} timeLeftStr={timeLeftStr} currentProgressPct={currentProgressPct} />;
  }

  return (
    <Motion.div className={styles.nowLine} {...fadeIn(0.16)}>
      <span className={styles.nowPill}>Now</span>
      <span className={styles.nowText}>Nothing on right now</span>
    </Motion.div>
  );
}

function TodayCommute({ commuteInfo, loadingCommute, leaveByInfo, nextCampus }) {
  if (!nextCampus && !loadingCommute) return null;
  return <CommuteContextCard campus={nextCampus} journey={commuteInfo} loading={loadingCommute} leaveByInfo={leaveByInfo} />;
}

function NextEventRow({ nextEvent, countdown }) {
  return (
    <Motion.div className={styles.upNextRow} {...fadeIn(0.2)}>
      <div className={styles.upNextLeft}>
        <span className={styles.upNextLabel}>Up next</span>
      </div>
      {nextEvent ? <NextEventDetails nextEvent={nextEvent} countdown={countdown} /> : <NextEventEmpty />}
    </Motion.div>
  );
}

function NextEventDetails({ nextEvent, countdown }) {
  return (
    <div className={styles.nextBlock}>
      <span className={styles.nextTitle}>{nextEvent.title}</span>
      <span className={styles.nextMeta}>
        at {formatTime(nextEvent.start_time)}
        {countdown.text ? ` · ${countdown.text}` : ""}
        <EventLocationMeta location={nextEvent.location} />
      </span>
    </div>
  );
}

function EventLocationMeta({ location }) {
  if (!location) return null;
  return (
    <>
      <span className={styles.nextMetaDivider}>·</span>
      <LocationLink
        location={location}
        className={styles.nextLocationLink}
        textClassName={styles.nextLocationText}
      />
    </>
  );
}

function NextEventEmpty() {
  return <span className={styles.nextTitle}>No more events today</span>;
}

function TodayView(props) {
  const vm = buildTodayViewModel(props);
  return (
    <>
      <WidgetHeader eventCount={vm.eventCount} taskCount={vm.taskCount} />
      <TodayClock liveClock={vm.liveClock} label={vm.label} />
      <TodayAlerts {...vm.alertProps} />
      <TodayCurrentState {...vm.currentStateProps} />
      <NextEventRow nextEvent={vm.nextEvent} countdown={vm.countdown} />
      <TodayCommute {...vm.commuteProps} />
    </>
  );
}

function RightNowView(props) {
  const view = selectRightNowView(props);
  return <div className={styles.root}>{view}</div>;
}

function selectRightNowView(props) {
  if (props.hasTimerSession) return <TimerSessionCard {...props} />;
  if (!props.isToday) return renderNonToday(props);
  if (props.isEndOfDay) return renderEndOfDay(props);
  if (props.isEmptyDay) return renderEmptyDay(props);
  return <TodayView {...props} />;
}

function renderNonToday({ liveClock, sortedEvents }) {
  return <NonTodayCard liveClock={liveClock} firstEvent={sortedEvents?.[0]} />;
}

function renderEndOfDay(props) {
  return (
    <EndOfDayCard
      liveClock={props.liveClock}
      completedCount={props.completedCount}
      tasksLength={props.tasksLength}
      eventsToday={props.eventsToday}
      tomorrowFirstEvent={props.tomorrowFirstEvent}
      tomorrowTime={props.tomorrowTime}
    />
  );
}

function renderEmptyDay(props) {
  return (
    <EmptyDayCard
      liveClock={props.liveClock}
      tomorrowFirstEvent={props.tomorrowFirstEvent}
      tomorrowTime={props.tomorrowTime}
    />
  );
}

export function RightNowWidget(props) {
  const liveClock = useLiveClock();
  const model = useRightNowData(buildRightNowDataProps(props));
  const viewProps = buildRightNowViewProps(buildViewContext(props, liveClock));
  return <RightNowView {...buildWidgetProps({ viewProps, model, props })} />;
}
