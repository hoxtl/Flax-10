/*
 * Homepage timeline section.
 */

import { motion as Motion } from "framer-motion";
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { ConfirmModal } from "../../../components/common";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { MiniTimeline } from "./MiniTimeline";
import widgetStyles from "../../Modules/DashboardWidgets.module.css";

const SECTION_ANIMATION = { opacity: 0, y: 30 };
const SECTION_VISIBLE = { opacity: 1, y: 0 };
const SECTION_TRANSITION = { duration: 0.6, ease: [0.23, 1, 0.32, 1] };
const SECTION_VIEWPORT = { once: true, margin: "-50px" };

export function HomepageTimelineSection(props) {
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
    <AnimatedHeaderButton>
      <PrimaryButton size="small" pill className={styles.timelineHeaderButton} onClick={handleAutoSchedule} aria-label="Auto schedule study time" disabled={autoScheduleLoading}>
        {label}
      </PrimaryButton>
    </AnimatedHeaderButton>
  );
}

function RescheduleEventsButton({ handleResolveTimelineConflicts, onOpenRescheduleConfirm, resolveConflictsLoading, selectedDate, styles }) {
  if (!isToday(selectedDate) || !handleResolveTimelineConflicts) return null;
  return (
    <AnimatedHeaderButton>
      <PrimaryButton size="small" pill className={styles.timelineHeaderButton} onClick={onOpenRescheduleConfirm || handleResolveTimelineConflicts} aria-label="Reschedule my events" disabled={resolveConflictsLoading}>
        {resolveConflictsLoading ? "Rescheduling…" : "Reschedule my events"}
      </PrimaryButton>
    </AnimatedHeaderButton>
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

function AnimatedHeaderButton({ children }) {
  return <Motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{children}</Motion.div>;
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
