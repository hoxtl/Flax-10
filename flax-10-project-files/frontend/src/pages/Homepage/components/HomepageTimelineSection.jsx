<<<<<<< HEAD
/*
 * Homepage timeline section.
 */

import { motion as Motion } from "framer-motion";
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isToday } from "../../../components/calendar/utils/dateUtils";
import { ConfirmModal } from "../../../components/common";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import { MiniTimeline } from "./mini_timeline";
import widgetStyles from "../../modules/DashboardWidgets.module.css";
=======
/* Homepage timeline section: merged widget support with refactored timeline helpers. */

import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import { MiniTimeline } from "./MiniTimeline";
import { isToday } from "../../../components/Calendar/utils/dateUtils";

function toggleCompleteHandler(setCompletedEventIds) {
  return (eventId) => setCompletedEventIds((prev) => {
    const next = new Set(prev);
    if (next.has(eventId)) next.delete(eventId);
    else next.add(eventId);
    return next;
  });
}

function buildTimelineCallbacks(props) {
  return {
    onQuickStart: props.handleQuickStartGap,
    onTaskToggle: props.handleTaskToggle,
    onCardClick: props.openTimelinePopup,
    onEdit: (ev) => props.openModal(ev, ev.tag),
    onConflictAutoMove: props.handleConflictAutoMove,
    onPushTomorrow: props.handleConflictPushTomorrow,
    onDelete: props.handleTimelineDelete,
    onReschedule: props.handleReschedule,
    onToggleComplete: toggleCompleteHandler(props.setCompletedEventIds),
  };
}

function buildTimelineProps(props) {
  const { sortedEvents, selectedDate, now, dayTasks, tasksDueToday } = props;
  const { suggestableTasks, deadlineSuggestions, taskLists, getTag, completedEventIds } = props;
  const { hasTimerSession, timerTask, timeLeft, timerMode, styles } = props;
  return {
    sortedEvents,
    selectedDate,
    now,
    dayTasks,
    tasksDueToday,
    suggestableTasks,
    deadlineSuggestions,
    taskLists,
    getTag,
    completedEventIds,
    hasTimerSession,
    timerTask,
    timeLeft,
    timerMode,
    styles,
    ...buildTimelineCallbacks(props),
  };
}

function ReplanButton({ selectedDate, handleReplanDay, replanLoading, missedItems, overdueTasksForNow, styles }) {
  if (!isToday(selectedDate) || !handleReplanDay) return null;

  const disabled = replanLoading || (!missedItems?.length && !overdueTasksForNow?.length);
  return (
    <Motion.button
      type="button"
      className={styles.manualScheduleBtn}
      onClick={handleReplanDay}
      disabled={disabled}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Re-plan overdue and missed items into free windows"
    >
      {replanLoading ? "Re-planning..." : "Re-plan"}
    </Motion.button>
  );
}

function ScheduleActions({ selectedDate, onOpenQuickAddSchedule, styles, isWidget }) {
  if (!isToday(selectedDate) || !onOpenQuickAddSchedule) return null;

  return (
    <Motion.div
      className={styles.scheduleActionGroup}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isWidget && (
        <button
          type="button"
          className={styles.manualScheduleBtn}
          onClick={() => onOpenQuickAddSchedule("schedule_manual")}
          aria-label="Open manual schedule quick add"
        >
          Manual Schedule
        </button>
      )}
      <button
        type="button"
        className={styles.autoScheduleBtn}
        onClick={() => onOpenQuickAddSchedule("schedule_auto")}
        aria-label="Open auto schedule quick add"
      >
        Auto Schedule
      </button>
    </Motion.div>
  );
}

function TimelineHeader(props) {
  const { selectedDate, handleReplanDay, replanLoading, missedItems, overdueTasksForNow, onOpenQuickAddSchedule, styles, isWidget } = props;

  return (
    <div className={styles.timelineHeader}>
      {isWidget ? (
        <div className={baseStyles.widgetHeader} style={{ padding: 0, marginBottom: 0, background: "transparent", border: "none" }}>
          <div className={baseStyles.headerIconWrap} aria-hidden>
            <CalendarIcon className={baseStyles.headerIcon} size={16} strokeWidth={1.75} />
          </div>
          <h3 className={baseStyles.headerTitle}>Your Plan For Today</h3>
        </div>
      ) : (
        <div className={styles.timelineHeaderLeft}>
          <div className={styles.timelineHeaderIconWrap} aria-hidden>
            <CalendarIcon size={17} strokeWidth={1.75} />
          </div>
          <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
        </div>
      )}
      <div className={styles.timelineHeaderRight}>
        <Link to="/calendar" className={styles.timelineHeaderActionLink}>View my calendar →</Link>
        <ScheduleActions selectedDate={selectedDate} onOpenQuickAddSchedule={onOpenQuickAddSchedule} styles={styles} isWidget={isWidget} />
        <ReplanButton
          selectedDate={selectedDate}
          handleReplanDay={handleReplanDay}
          replanLoading={replanLoading}
          missedItems={missedItems}
          overdueTasksForNow={overdueTasksForNow}
          styles={styles}
        />
      </div>
    </div>
  );
}

function TimelineTrack({ styles, children }) {
  return (
    <div className={styles.timelineTrack}>
      <Motion.div
        className={styles.timelineTrackContent}
        layout
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        {children}
      </Motion.div>
    </div>
  );
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const SECTION_ANIMATION = { opacity: 0, y: 30 };
const SECTION_VISIBLE = { opacity: 1, y: 0 };
const SECTION_TRANSITION = { duration: 0.6, ease: [0.23, 1, 0.32, 1] };
const SECTION_VIEWPORT = { once: true, margin: "-50px" };

export function HomepageTimelineSection(props) {
<<<<<<< HEAD
  const content = <TimelineContent {...props} />;
  if (props.isWidget) return content;
  return <Motion.div className={props.styles.bentoSpine} id="timeline-section" initial={SECTION_ANIMATION} whileInView={SECTION_VISIBLE} viewport={SECTION_VIEWPORT} transition={SECTION_TRANSITION}>{content}</Motion.div>;
}

function TimelineInnerContent(props, showRescheduleConfirm, setShowRescheduleConfirm) {
  return (
    <>
      <TimelineHeader {...props} onOpenRescheduleConfirm={() => setShowRescheduleConfirm(true)} />
      <TimelineTrack styles={props.styles}><MiniTimeline {...getMiniTimelineProps(props)} /></TimelineTrack>
      <RescheduleConfirmModal open={showRescheduleConfirm} onCancel={() => setShowRescheduleConfirm(false)} onConfirm={() => confirmReschedule(props, setShowRescheduleConfirm)} />
    </>
  );
}

function TimelineContent(props) {
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const inner = TimelineInnerContent(props, showRescheduleConfirm, setShowRescheduleConfirm);
  if (props.isWidget) return inner;
  return <div className={props.styles.timelineBox}>{inner}</div>;
}

function TimelineHeader(props) {
  return (
    <div className={widgetStyles.widgetHeader}>
      <div className={widgetStyles.widgetIconWrap} aria-hidden><CalendarIcon size={17} strokeWidth={1.75} /></div>
      <span className={widgetStyles.widgetTitle}>Your Plan For Today</span>
      <div className={props.styles.timelineHeaderRight}>
        <CalendarLink styles={props.styles} />
        <AutoScheduleButton {...props} />
        <RescheduleEventsButton {...props} />
      </div>
    </div>
  );
}

function CalendarLink({ styles }) {
  const navigate = useNavigate();
  return (
    <PrimaryButton type="button" size="small" pill className={styles.timelineHeaderButton} onClick={() => navigate("/calendar")}>
      View my calendar
    </PrimaryButton>
  );
}

function AutoScheduleButton({ handleAutoSchedule, autoScheduleLoading, styles }) {
  if (!handleAutoSchedule) return null;
  const label = autoScheduleLoading ? "Scheduling…" : "Auto schedule study time";
  return (
    <Motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <PrimaryButton size="small" pill className={styles.timelineHeaderButton} onClick={handleAutoSchedule} aria-label="Auto schedule study time" disabled={autoScheduleLoading}>
        {label}
      </PrimaryButton>
    </Motion.div>
  );
}

function RescheduleEventsButton({ handleResolveTimelineConflicts, onOpenRescheduleConfirm, resolveConflictsLoading, selectedDate, styles }) {
  if (!isToday(selectedDate) || !handleResolveTimelineConflicts) return null;
  return (
    <Motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <PrimaryButton size="small" pill className={styles.timelineHeaderButton} onClick={onOpenRescheduleConfirm || handleResolveTimelineConflicts} aria-label="Reschedule my events" disabled={resolveConflictsLoading}>
        {resolveConflictsLoading ? "Rescheduling…" : "Reschedule my events"}
      </PrimaryButton>
    </Motion.div>
  );
}

function RescheduleConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <ConfirmModal
      title="Reschedule my events"
      message="This will clear movable conflicts in your plan and may move personal events to tomorrow if today has no free space left."
      confirmText="Reschedule now"
      cancelText="Keep plan"
      onConfirm={onConfirm}
      onCancel={onCancel}
      infoHint="⚠️ Lectures, societies, exams, and fixed deadlines stay where they are."
    />
  );
}

async function confirmReschedule(props, setShowRescheduleConfirm) {
  setShowRescheduleConfirm(false);
  await props.handleResolveTimelineConflicts?.();
}

function TimelineTrack({ children, styles }) {
  return <div className={styles.timelineTrack}><Motion.div className={styles.timelineTrackContent} layout initial={false} transition={{ type: "spring", stiffness: 400, damping: 35 }}>{children}</Motion.div></div>;
}

function getMiniTimelineProps(props) {
  return {
    ...getMiniTimelineBaseProps(props),
    ...getMiniTimelineActionProps(props),
    ...getMiniTimelineTimerProps(props),
  };
}

function getMiniTimelineBaseProps(props) {
  return {
    completedEventIds: props.completedEventIds,
    dayTasks: props.dayTasks,
    deadlineSuggestions: props.deadlineSuggestions,
    getTag: props.getTag,
    now: props.now,
    selectedDate: props.selectedDate,
    sortedEvents: props.sortedEvents,
    styles: props.styles,
    suggestableTasks: props.suggestableTasks,
    taskLists: props.taskLists,
    tasksDueToday: props.tasksDueToday,
  };
}

function getMiniTimelineActionProps(props) {
  return {
    onCardClick: props.openTimelinePopup,
    onConflictAutoMove: props.handleConflictAutoMove,
    onDelete: props.handleTimelineDelete,
    onEdit: (event) => props.openModal(event, event.tag),
    onPushTomorrow: props.handleConflictPushTomorrow,
    onQuickStart: props.handleQuickStartGap,
    onReschedule: props.handleReschedule,
    onTaskToggle: props.handleTaskToggle,
    onToggleComplete: createToggleHandler(props.setCompletedEventIds),
  };
}

function getMiniTimelineTimerProps(props) {
  return {
    hasTimerSession: props.hasTimerSession,
    timeLeft: props.timeLeft,
    timerMode: props.timerMode,
    timerTask: props.timerTask,
  };
}

function createToggleHandler(setCompletedEventIds) {
  return (eventId) => setCompletedEventIds((prev) => toggleCompletedId(prev, eventId));
}

function toggleCompletedId(prev, eventId) {
  const next = new Set(prev);
  if (next.has(eventId)) next.delete(eventId);
  else next.add(eventId);
  return next;
}
=======
  const { styles, isWidget = false } = props;

  const content = (
    <div className={styles.timelineBox}>
      <TimelineHeader {...props} isWidget={isWidget} />
      <TimelineTrack styles={styles}>
        <MiniTimeline {...buildTimelineProps(props)} />
      </TimelineTrack>
    </div>
  );

  if (isWidget) {
    return content;
  }

  return (
    <Motion.div
      className={styles.bentoSpine}
      id="timeline-section"
      initial={SECTION_ANIMATION}
      whileInView={SECTION_VISIBLE}
      viewport={SECTION_VIEWPORT}
      transition={SECTION_TRANSITION}
    >
      {content}
    </Motion.div>
  );
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
