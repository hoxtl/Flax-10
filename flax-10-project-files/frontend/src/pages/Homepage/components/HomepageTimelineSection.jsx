import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
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
  isWidget = false,
  onOpenQuickAddSchedule,
}) {
  const content = (
    <div className={isWidget ? styles.timelineBoxWidget : styles.timelineBox}>
      <div className={styles.timelineHeader}>
        <div className={baseStyles.widgetHeader} style={{ padding: 0, marginBottom: 0, background: 'transparent', border: 'none' }}>
          <div className={baseStyles.headerIconWrap} aria-hidden>
            <CalendarIcon className={baseStyles.headerIcon} size={16} strokeWidth={1.75} />
          </div>
          <h3 className={baseStyles.headerTitle}>Your Plan For Today</h3>
        </div>
        <div className={styles.timelineHeaderRight}>
          <div className={styles.headerRightStack}>
            <Link to="/calendar" className={styles.timelineHeaderActionLink}>View my calendar →</Link>
            <div className={styles.timelineHeaderActionsGroup}>
              {isToday(selectedDate) && onOpenQuickAddSchedule && (
                <motion.div
                  className={styles.scheduleActionGroup}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    className={styles.manualScheduleBtn}
                    onClick={() => onOpenQuickAddSchedule('schedule_manual')}
                    aria-label="Open manual schedule quick add"
                  >
                    🧩 Manual Schedule
                  </button>
                  <button
                    type="button"
                    className={styles.autoScheduleBtn}
                    onClick={() => onOpenQuickAddSchedule('schedule_auto')}
                    aria-label="Open auto schedule quick add"
                  >
                    ⚙️ Auto Schedule
                  </button>
                </motion.div>
              )}
              {isToday(selectedDate) && handleReplanDay && (
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
  );

  if (isWidget) {
    return content;
  }

  return (
    <motion.section
      className={styles.timelineSection}
      id="timeline-section"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      {content}
    </motion.section>
  );
}
