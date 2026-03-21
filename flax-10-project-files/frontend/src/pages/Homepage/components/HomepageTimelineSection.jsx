/* Homepage timeline section – day plan overview with replan action. */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
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
    sortedEvents, selectedDate, now, dayTasks, tasksDueToday,
    suggestableTasks, deadlineSuggestions, taskLists, getTag, completedEventIds,
    hasTimerSession, timerTask, timeLeft, timerMode, styles,
    ...buildTimelineCallbacks(props),
  };
}

function ReplanButton({ selectedDate, handleReplanDay, replanLoading, missedItems, overdueTasksForNow, styles }) {
  if (!isToday(selectedDate)) return null;
  const disabled = replanLoading || (!missedItems?.length && !overdueTasksForNow?.length);
  return (
    <motion.button
      type="button"
      className={styles.replanBtn}
      onClick={handleReplanDay}
      disabled={disabled}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Re-plan overdue and missed items into free windows"
    >
      {replanLoading ? "Re-planning\u2026" : "\u2728 Re-plan"}
    </motion.button>
  );
}

function TimelineHeader({ selectedDate, handleReplanDay, replanLoading, missedItems, overdueTasksForNow, styles }) {
  return (
    <div className={styles.timelineHeader}>
      <div className={styles.timelineHeaderLeft}>
        <div className={styles.timelineHeaderIconWrap} aria-hidden>
          <CalendarIcon size={17} strokeWidth={1.75} />
        </div>
        <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
      </div>
      <div className={styles.timelineHeaderRight}>
        <Link to="/calendar" className={styles.timelineHeaderActionLink}>View my calendar &rarr;</Link>
        <ReplanButton {...{ selectedDate, handleReplanDay, replanLoading, missedItems, overdueTasksForNow, styles }} />
      </div>
    </div>
  );
}

function TimelineTrack({ styles, children }) {
  return (
    <div className={styles.timelineTrack}>
      <motion.div
        className={styles.timelineTrackContent}
        layout
        initial={false}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const SECTION_ANIMATION = { opacity: 0, y: 30 };
const SECTION_VISIBLE = { opacity: 1, y: 0 };
const SECTION_TRANSITION = { duration: 0.6, ease: [0.23, 1, 0.32, 1] };

const SECTION_VIEWPORT = { once: true, margin: "-50px" };

export function HomepageTimelineSection(props) {
  const { styles } = props;
  return (
    <motion.div className={styles.bentoSpine} id="timeline-section" initial={SECTION_ANIMATION} whileInView={SECTION_VISIBLE} viewport={SECTION_VIEWPORT} transition={SECTION_TRANSITION}>
      <div className={styles.timelineBox}>
        <TimelineHeader {...props} />
        <TimelineTrack styles={styles}>
          <MiniTimeline {...buildTimelineProps(props)} />
        </TimelineTrack>
      </div>
    </motion.div>
  );
}
