import { formatTime } from "../utils/dateFormatUtils";

export function formatTimerLabel(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function timerProgress(totalMinutes, timeLeft) {
  const totalSeconds = totalMinutes * 60;
  return Math.max(0, Math.min(100, ((totalSeconds - Math.max(0, timeLeft)) / totalSeconds) * 100));
}

export function buildTodayHeaderMeta(eventCount, taskCount) {
  const parts = [];
  if (eventCount > 0) parts.push(`${eventCount} event${eventCount === 1 ? "" : "s"}`);
  if (taskCount > 0) parts.push(`${taskCount} task${taskCount === 1 ? "" : "s"} left`);
  return parts.join(" · ");
}

export function buildTimerSessionViewModel({ liveClock, timerMode, timerTask, timeLeft, workTime, breakTime, onOpenTimer }) {
  const isBreak = timerMode === "break";
  const totalMinutes = isBreak ? breakTime || 5 : workTime || 25;
  return {
    liveClock,
    timeLeft,
    timerTask,
    onOpenTimer,
    isBreak,
    progressPct: timerProgress(totalMinutes, timeLeft),
  };
}

export function buildAlertState({ showConflictAlert, showTflAlert, showTfl, leaveByInfo }) {
  return {
    showConflicts: showConflictAlert,
    showTflAlert: showTflAlert && showTfl && !!leaveByInfo,
    onDismissConflict: (setShow) => () => setShow(false),
    onDismissTfl: (setShow) => () => setShow(false),
  };
}

export function buildTodayViewModel(props) {
  return {
    liveClock: props.liveClock,
    label: buildTodayLabel(props),
    eventCount: props.eventCount,
    taskCount: props.tasksPending,
    alertProps: buildAlertProps(props),
    currentStateProps: buildCurrentStateProps(props),
    nextEvent: props.nextEvent,
    countdown: props.countdown,
    commuteProps: buildCommuteProps(props),
  };
}

function buildTodayLabel({ currentBlock, nextEvent }) {
  if (currentBlock) return "In session";
  if (nextEvent) return "Up next";
  return "Free now";
}

function buildAlertProps(props) {
  return {
    conflicts: props.conflicts,
    leaveByInfo: props.leaveByInfo,
    showConflictAlert: props.showConflictAlert,
    showTflAlert: props.showTflAlert,
    setShowConflictAlert: props.setShowConflictAlert,
    setShowTflAlert: props.setShowTflAlert,
    showTfl: props.showTfl,
  };
}

function buildCurrentStateProps(props) {
  return {
    currentBlock: props.currentBlock,
    currentProgressPct: props.currentProgressPct,
    timeRangeStr: props.timeRangeStr,
    timeLeftStr: props.timeLeftStr,
  };
}

function buildCommuteProps(props) {
  return {
    commuteInfo: props.commuteInfo,
    loadingCommute: props.loadingCommute,
    leaveByInfo: props.leaveByInfo,
    nextCampus: props.nextCampus,
  };
}

export function buildRightNowViewProps({ liveClock, now, sortedEvents, taskWidgetItemsOnly, tomorrowFirstEvent }) {
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

export function buildRightNowDataProps(props) {
  return {
    now: props.now,
    isToday: props.isToday,
    navigatorContext: props.navigatorContext,
    sortedEvents: props.sortedEvents,
    tflDelays: props.tflDelays,
    taskWidgetItemsOnly: props.taskWidgetItemsOnly,
  };
}

export function buildViewContext(props, liveClock) {
  return {
    liveClock,
    now: props.now,
    sortedEvents: props.sortedEvents,
    taskWidgetItemsOnly: props.taskWidgetItemsOnly,
    tomorrowFirstEvent: props.tomorrowFirstEvent,
  };
}

export function buildWidgetProps({ viewProps, model, props }) {
  return {
    ...viewProps,
    ...model,
    isToday: props.isToday,
    hasTimerSession: props.hasTimerSession,
    timerMode: props.timerMode,
    timerTask: props.timerTask,
    timeLeft: props.timeLeft,
    workTime: props.workTime,
    breakTime: props.breakTime,
    onOpenTimer: props.onOpenTimer,
  };
}
