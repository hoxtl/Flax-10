/**
 * Right Now widget shell.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Sparkles, Sun } from "lucide-react";
import { formatTime } from "../utils/dateFormatUtils";
import { useRightNowData } from "../hooks/useRightNowData";
import {
  ActiveEventCard,
  CommuteContextCard,
  ConflictSummary,
  TflDelayCard,
  fadeIn,
} from "./RightNowSubComponents";
import styles from "./RightNowWidget.module.css";
import baseStyles from "../styles/WidgetBase.module.css";

function useLiveClock() {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );

  useEffect(() => {
    const id = setInterval(
      () =>
        setClock(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  return clock;
}

function formatTimerLabel(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function timerProgress(totalMinutes, timeLeft) {
  const totalSeconds = totalMinutes * 60;
  return Math.max(0, Math.min(100, ((totalSeconds - Math.max(0, timeLeft)) / totalSeconds) * 100));
}

function StatusHeader({ liveClock, label = "Right Now" }) {
  return (
    <motion.div className={baseStyles.widgetHeader} {...fadeIn(0)}>
      <div className={baseStyles.headerIconWrap}>
        <Clock size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
      </div>
      <span className={baseStyles.headerTitle}>{label}</span>
      {liveClock && <span className={baseStyles.headerMeta}>{liveClock}</span>}
    </motion.div>
  );
}

function WidgetHeader({ eventCount, taskCount }) {
  return (
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

function TimerSessionCard({ liveClock, timerMode, timerTask, timeLeft, workTime, breakTime, onOpenTimer }) {
  const isBreak = timerMode === "break";
  const totalMinutes = isBreak ? breakTime || 5 : workTime || 25;
  const pct = timerProgress(totalMinutes, timeLeft);
  return (
    <>
      <StatusHeader liveClock={liveClock} />
      <TimerClock timeLeft={timeLeft} isBreak={isBreak} timerTask={timerTask} />
      <TimerControls pct={pct} onOpenTimer={onOpenTimer} />
    </>
  );
}

function TimerClock({ timeLeft, isBreak, timerTask }) {
  return (
    <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{formatTimerLabel(timeLeft)}</span>
      <span className={styles.clockLabel}>{isBreak ? "Break" : "Focus"} · {timerTask || (isBreak ? "Break time" : "Focus session")}</span>
    </motion.div>
  );
}

function TimerControls({ pct, onOpenTimer }) {
  return (
    <motion.div className={styles.timerBlock} {...fadeIn(0.07)}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <button type="button" className={styles.timerBtn} onClick={onOpenTimer}>
        Open timer →
      </button>
    </motion.div>
  );
}

function NonTodayCard({ liveClock, firstEvent }) {
  return (
    <>
      <StatusHeader liveClock={liveClock} />
      <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
        <span className={styles.clockTime}>{liveClock}</span>
        <span className={styles.clockLabel}>Not today's view</span>
      </motion.div>
      <motion.div {...fadeIn(0.1)}>
        {firstEvent ? <EventPreview event={firstEvent} /> : <p className={styles.nowEmpty}>No events for this day.</p>}
      </motion.div>
    </>
  );
}

function EventPreview({ event }) {
  return (
    <>
      <p className={styles.upNextTitle}>{event.title}</p>
      {event.start_time && <p className={styles.upNextDetails}>{formatTime(event.start_time)}</p>}
    </>
  );
}

function EndOfDayCard({ liveClock, completedCount, tasksLength, eventsToday, tomorrowFirstEvent, tomorrowTime }) {
  return (
    <>
      <StatusHeader liveClock={liveClock} />
      <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
        <span className={styles.clockTime}>{liveClock}</span>
        <span className={styles.clockLabel}>End of day</span>
      </motion.div>
      <motion.div className={styles.endOfDayWrap} {...fadeIn(0.07)}>
        <EndOfDaySummary completedCount={completedCount} tasksLength={tasksLength} eventsToday={eventsToday} />
        {tomorrowFirstEvent && <TomorrowSection event={tomorrowFirstEvent} time={tomorrowTime} />}
      </motion.div>
    </>
  );
}

function EndOfDaySummary({ completedCount, tasksLength, eventsToday }) {
  return (
    <div className={styles.endOfDayTopRow}>
      <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <Sparkles size={22} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
      </motion.div>
      <div>
        <p className={styles.endOfDayTitle}>Day complete — nice work!</p>
        <p className={styles.endOfDaySub}>
          {completedCount > 0 && `${completedCount}${tasksLength > 0 ? `/${tasksLength}` : ""} tasks`}
          {completedCount > 0 && eventsToday > 0 && " · "}
          {eventsToday > 0 && `${eventsToday} event${eventsToday !== 1 ? "s" : ""} attended`}
        </p>
      </div>
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
    <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{liveClock}</span>
      <span className={styles.clockLabel}>Nothing scheduled today</span>
    </motion.div>
  );
}

function EmptyBody({ tomorrowFirstEvent, tomorrowTime }) {
  return (
    <motion.div className={styles.emptyDay} {...fadeIn(0.1)}>
      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Sun size={28} strokeWidth={1.25} color="var(--color-primary)" aria-hidden />
      </motion.div>
      <p className={styles.emptyDayTitle}>Free day — enjoy it!</p>
      {tomorrowFirstEvent && tomorrowTime && <p className={styles.emptyDayTomorrow}>Tomorrow: {tomorrowFirstEvent.title} at {tomorrowTime}</p>}
    </motion.div>
  );
}

function TodayAlerts({ conflicts, leaveByInfo, showConflictAlert, showTflAlert, setShowConflictAlert, setShowTflAlert, showTfl }) {
  return (
    <>
      <ConflictAlert enabled={showConflictAlert} conflicts={conflicts} onDismiss={() => setShowConflictAlert(false)} />
      <TflAlert enabled={showTflAlert && showTfl && !!leaveByInfo} leaveByInfo={leaveByInfo} onDismiss={() => setShowTflAlert(false)} />
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
    <motion.div className={styles.clockBlock} {...fadeIn(0.04)}>
      <span className={styles.clockTime}>{liveClock}</span>
      <span className={styles.clockLabel}>{label}</span>
    </motion.div>
  );
}

function TodayCurrentState({ currentBlock, currentProgressPct, timeRangeStr, timeLeftStr }) {
  if (currentBlock) {
    return <ActiveEventCard currentBlock={currentBlock} timeRangeStr={timeRangeStr} timeLeftStr={timeLeftStr} currentProgressPct={currentProgressPct} />;
  }

  return (
    <motion.div className={styles.nowLine} {...fadeIn(0.16)}>
      <span className={styles.nowPill}>Now</span>
      <span className={styles.nowText}>Nothing on right now</span>
    </motion.div>
  );
}

function TodayCommute({ commuteInfo, loadingCommute, leaveByInfo, nextCampus }) {
  if (!nextCampus && !loadingCommute) return null;
  return <CommuteContextCard campus={nextCampus} journey={commuteInfo} loading={loadingCommute} leaveByInfo={leaveByInfo} />;
}

function NextEventRow({ nextEvent, countdown }) {
  return (
    <motion.div className={styles.upNextRow} {...fadeIn(0.2)}>
      <div className={styles.upNextLeft}>
        <span className={styles.upNextLabel}>Up next</span>
      </div>
      {nextEvent ? <NextEventDetails nextEvent={nextEvent} countdown={countdown} /> : <NextEventEmpty />}
    </motion.div>
  );
}

function NextEventDetails({ nextEvent, countdown }) {
  return (
    <div className={styles.nextBlock}>
      <span className={styles.nextTitle}>{nextEvent.title}</span>
      <span className={styles.nextMeta}>
        at {formatTime(nextEvent.start_time)}
        {countdown.text ? ` · ${countdown.text}` : ""}
        {nextEvent.location ? ` · ${nextEvent.location}` : ""}
      </span>
    </div>
  );
}

function NextEventEmpty() {
  return <span className={styles.nextTitle}>No more events today</span>;
}

function TodayView(props) {
  return (
    <>
      <WidgetHeader eventCount={props.eventCount} taskCount={props.tasksPending} />
      <TodayClock liveClock={props.liveClock} label={props.currentBlock ? "In session" : props.nextEvent ? "Up next" : "Free now"} />
      <TodayAlerts conflicts={props.conflicts} leaveByInfo={props.leaveByInfo} showConflictAlert={props.showConflictAlert} showTflAlert={props.showTflAlert} setShowConflictAlert={props.setShowConflictAlert} setShowTflAlert={props.setShowTflAlert} showTfl={props.showTfl} />
      <TodayCurrentState currentBlock={props.currentBlock} currentProgressPct={props.currentProgressPct} timeRangeStr={props.timeRangeStr} timeLeftStr={props.timeLeftStr} />
      <NextEventRow nextEvent={props.nextEvent} countdown={props.countdown} />
      <TodayCommute commuteInfo={props.commuteInfo} loadingCommute={props.loadingCommute} leaveByInfo={props.leaveByInfo} nextCampus={props.nextCampus} />
    </>
  );
}

function RightNowView(props) {
  const body = props.hasTimerSession
    ? <TimerSessionCard {...props} />
    : !props.isToday
      ? <NonTodayCard liveClock={props.liveClock} firstEvent={props.sortedEvents?.[0]} />
      : props.isEndOfDay
        ? <EndOfDayCard liveClock={props.liveClock} completedCount={props.completedCount} tasksLength={props.tasksLength} eventsToday={props.eventsToday} tomorrowFirstEvent={props.tomorrowFirstEvent} tomorrowTime={props.tomorrowTime} />
        : props.isEmptyDay
          ? <EmptyDayCard liveClock={props.liveClock} tomorrowFirstEvent={props.tomorrowFirstEvent} tomorrowTime={props.tomorrowTime} />
          : <TodayView {...props} />;

  return <div className={styles.root}>{body}</div>;
}

function buildRightNowViewProps({ liveClock, now, sortedEvents, taskWidgetItemsOnly, tomorrowFirstEvent }) {
  return {
    liveClock,
    sortedEvents,
    completedCount: taskWidgetItemsOnly.filter((task) => task.completed).length,
    tasksLength: taskWidgetItemsOnly.length,
    eventsToday: (sortedEvents || []).filter((event) => event.start_time && new Date(event.start_time).getTime() < new Date(now).getTime()).length,
    tomorrowFirstEvent,
    tomorrowTime: tomorrowFirstEvent?.start_time ? formatTime(tomorrowFirstEvent.start_time) : null,
  };
}

function buildRightNowDataProps(props) {
  return {
    now: props.now,
    isToday: props.isToday,
    navigatorContext: props.navigatorContext,
    sortedEvents: props.sortedEvents,
    tflDelays: props.tflDelays,
    taskWidgetItemsOnly: props.taskWidgetItemsOnly,
  };
}

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
  const liveClock = useLiveClock();
  const model = useRightNowData(buildRightNowDataProps({ now, isToday, navigatorContext, sortedEvents, tflDelays, taskWidgetItemsOnly }));
  return <RightNowView {...buildRightNowViewProps({ liveClock, now, sortedEvents, taskWidgetItemsOnly, tomorrowFirstEvent })} {...model} hasTimerSession={hasTimerSession} timerMode={timerMode} timerTask={timerTask} timeLeft={timeLeft} workTime={workTime} breakTime={breakTime} onOpenTimer={onOpenTimer} />;
}
