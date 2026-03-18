import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import { MiniTimeline } from "./MiniTimeline";
import { isToday } from "../../../components/Calendar/utils/dateUtils";

export function HomepageTimelineSection({
  selectedDate,
  handleReplanDay,
  replanLoading,
  missedItems,
  overdueTasksForNow,
  sortedEvents,
  now,
  dayTasks,
  tasksDueToday,
  suggestableTasks,
  deadlineSuggestions,
  taskLists,
  handleQuickStartGap,
  handleTaskToggle,
  openTimelinePopup,
  openModal,
  handleConflictAutoMove,
  handleConflictPushTomorrow,
  handleTimelineDelete,
  handleReschedule,
  getTag,
  completedEventIds,
  setCompletedEventIds,
  hasTimerSession,
  timerTask,
  timeLeft,
  timerMode,
  styles,
}) {
  return (
    <motion.div
      className={styles.bentoSpine}
      id="timeline-section"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className={styles.timelineBox}>
        <div className={styles.timelineHeader}>
          <div className={styles.timelineHeaderLeft}>
            <div className={styles.timelineHeaderIconWrap} aria-hidden>
              <CalendarIcon size={17} strokeWidth={1.75} />
            </div>
            <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
          </div>
          <div className={styles.timelineHeaderRight}>
            <Link to="/calendar" className={styles.timelineHeaderActionLink}>View my calendar →</Link>
            {isToday(selectedDate) && (
              <motion.button
                type="button"
                className={styles.replanBtn}
                onClick={handleReplanDay}
                disabled={replanLoading || (!missedItems?.length && !(overdueTasksForNow?.length))}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                aria-label="Re-plan overdue and missed items into free windows"
              >
                {replanLoading ? "Re-planning…" : "✨ Re-plan"}
              </motion.button>
            )}
          </div>
        </div>
        <div className={styles.timelineTrack}>
          <motion.div
            className={styles.timelineTrackContent}
            layout
            initial={false}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            <MiniTimeline
              sortedEvents={sortedEvents}
              selectedDate={selectedDate}
              now={now}
              dayTasks={dayTasks}
              tasksDueToday={tasksDueToday}
              suggestableTasks={suggestableTasks}
              deadlineSuggestions={deadlineSuggestions}
              taskLists={taskLists}
              onQuickStart={handleQuickStartGap}
              onTaskToggle={handleTaskToggle}
              onCardClick={openTimelinePopup}
              onEdit={(ev) => openModal(ev, ev.tag)}
              onConflictAutoMove={handleConflictAutoMove}
              onPushTomorrow={handleConflictPushTomorrow}
              onDelete={handleTimelineDelete}
              onReschedule={handleReschedule}
              getTag={getTag}
              completedEventIds={completedEventIds}
              onToggleComplete={(eventId) => setCompletedEventIds((prev) => {
                const next = new Set(prev);
                if (next.has(eventId)) next.delete(eventId);
                else next.add(eventId);
                return next;
              })}
              hasTimerSession={hasTimerSession}
              timerTask={timerTask}
              timeLeft={timeLeft}
              timerMode={timerMode}
              styles={styles}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
