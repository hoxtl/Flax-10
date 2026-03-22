/**
 * Homepage timeline section.
 */

import { motion as Motion } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { MiniTimeline } from "./MiniTimeline";

const SECTION_ANIMATION = { opacity: 0, y: 30 };
const SECTION_VISIBLE = { opacity: 1, y: 0 };
const SECTION_TRANSITION = { duration: 0.6, ease: [0.23, 1, 0.32, 1] };
const SECTION_VIEWPORT = { once: true, margin: "-50px" };

export function HomepageTimelineSection(props) {
  const content = <TimelineContent {...props} />;
  if (props.isWidget) return content;
  return <Motion.div className={props.styles.bentoSpine} id="timeline-section" initial={SECTION_ANIMATION} whileInView={SECTION_VISIBLE} viewport={SECTION_VIEWPORT} transition={SECTION_TRANSITION}>{content}</Motion.div>;
}

function TimelineContent(props) {
  return <div className={props.styles.timelineBox}><TimelineHeader {...props} /><TimelineTrack styles={props.styles}><MiniTimeline {...getMiniTimelineProps(props)} /></TimelineTrack></div>;
}

function TimelineHeader(props) {
  return (
    <div className={props.styles.timelineHeader}>
      <HeaderTitle isWidget={props.isWidget} styles={props.styles} />
      <div className={props.styles.timelineHeaderRight}><CalendarLink styles={props.styles} /><ScheduleActions {...props} /><ReplanButton {...props} /></div>
    </div>
  );
}

function HeaderTitle({ isWidget, styles }) {
  return <div className={styles.timelineHeaderLeft}><div className={styles.timelineHeaderIconWrap} aria-hidden><CalendarIcon size={17} strokeWidth={1.75} /></div><h3 className={styles.timelineTitle} style={isWidget ? { textTransform: "none" } : undefined}>{isWidget ? "Your Plan For Today" : "YOUR PLAN FOR THE DAY"}</h3></div>;
}

function CalendarLink({ styles }) {
  return <Link to="/calendar" className={styles.timelineHeaderActionLink}><span className={styles.timelineCalendarTextFull}>View my calendar →</span><span className={styles.timelineCalendarTextMedium}>View calendar →</span><span className={styles.timelineCalendarTextShort}>Calendar →</span></Link>;
}

function ScheduleActions({ onOpenQuickAddSchedule, selectedDate, styles }) {
  if (!isToday(selectedDate) || !onOpenQuickAddSchedule) return null;
  return <Motion.div className={styles.scheduleActionGroup} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><ActionButton label="Manual Schedule" onClick={() => onOpenQuickAddSchedule("schedule_manual")} styles={styles} variant="manualScheduleBtn" /><ActionButton label="Auto Schedule" onClick={() => onOpenQuickAddSchedule("schedule_auto")} styles={styles} variant="autoScheduleBtn" /></Motion.div>;
}

function ActionButton({ label, onClick, styles, variant }) {
  return <button type="button" className={styles[variant]} onClick={onClick} aria-label={label}>{label}</button>;
}

function ReplanButton({ handleReplanDay, missedItems, overdueTasksForNow, replanLoading, selectedDate, styles }) {
  if (!isToday(selectedDate) || !handleReplanDay) return null;
  return <Motion.button type="button" className={styles.manualScheduleBtn} onClick={handleReplanDay} disabled={isReplanDisabled(replanLoading, missedItems, overdueTasksForNow)} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} aria-label="Re-plan overdue and missed items into free windows">{replanLoading ? "Re-planning..." : "Re-plan"}</Motion.button>;
}

function isReplanDisabled(replanLoading, missedItems, overdueTasksForNow) {
  return replanLoading || (!missedItems?.length && !overdueTasksForNow?.length);
}

function TimelineTrack({ children, styles }) {
  return <div className={styles.timelineTrack}><Motion.div className={styles.timelineTrackContent} layout initial={false} transition={{ type: "spring", stiffness: 400, damping: 35 }}>{children}</Motion.div></div>;
}

function getMiniTimelineProps(props) {
  return {
    completedEventIds: props.completedEventIds,
    dayTasks: props.dayTasks,
    deadlineSuggestions: props.deadlineSuggestions,
    getTag: props.getTag,
    hasTimerSession: props.hasTimerSession,
    now: props.now,
    onCardClick: props.openTimelinePopup,
    onConflictAutoMove: props.handleConflictAutoMove,
    onDelete: props.handleTimelineDelete,
    onEdit: (event) => props.openModal(event, event.tag),
    onPushTomorrow: props.handleConflictPushTomorrow,
    onQuickStart: props.handleQuickStartGap,
    onReschedule: props.handleReschedule,
    onTaskToggle: props.handleTaskToggle,
    onToggleComplete: createToggleHandler(props.setCompletedEventIds),
    selectedDate: props.selectedDate,
    sortedEvents: props.sortedEvents,
    styles: props.styles,
    suggestableTasks: props.suggestableTasks,
    taskLists: props.taskLists,
    tasksDueToday: props.tasksDueToday,
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
