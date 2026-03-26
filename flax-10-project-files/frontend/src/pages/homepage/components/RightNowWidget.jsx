/**
 * Right Now widget shell.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Clock, Sparkles, Sun } from "lucide-react";
import SharedWidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import LocationLink from "../../../components/common/location_link/LocationLink";
import { formatTime } from "../utils/dateFormatUtils";
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
} from "./RightNowWidget.viewmodel.js";
import styles from "./RightNowWidget.module.css";

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

function StatusHeader({ liveClock, label = "Right Now" }) {
  return (
    <Motion.div {...fadeIn(0)}>
      <SharedWidgetHeader icon={Clock} title={label} meta={liveClock} />
    </Motion.div>
  );
}

function WidgetHeader({ eventCount, taskCount }) {
  const meta = buildTodayHeaderMeta(eventCount, taskCount);
  return (
    <Motion.div {...fadeIn(0)}>
      <SharedWidgetHeader icon={Clock} title="Right Now" meta={meta || null} />
    </Motion.div>
  );
}

function TimerSessionCard(props) {
  const vm = buildTimerSessionViewModel(props);
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
