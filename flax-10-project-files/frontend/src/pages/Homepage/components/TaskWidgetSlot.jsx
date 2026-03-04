/**
 * Task widget slot content — Today's tasks (overdue + due today).
 * Compact row layout: checkbox + title + tag pill, no card borders.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { CheckSquare } from "lucide-react";
import EmptyStateCard from "../../../components/EmptyStateCard";
import AllTasksCompleteCard from "../../../components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";

const VISIBLE_COUNT = 5;

export function TaskWidgetSlot({
  styles,
  displayName,
  isToday,
  taskWidgetOverdueCount,
  taskWidgetSpineCompletedPct,
  taskWidgetItemsOnly,
  taskWidgetList,
  showAllTaskWidgetTasks,
  setShowAllTaskWidgetTasks,
  getTaskCategoryPill,
  getTaskCategoryColor,
  handleTaskWidgetComplete,
  taskWidgetRef,
  hasTimerSession,
  onStartFocus,
}) {
  const visibleList = showAllTaskWidgetTasks
    ? taskWidgetList
    : taskWidgetList.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, taskWidgetList.length - VISIBLE_COUNT);

  const taskWidgetCompletedCount = taskWidgetItemsOnly.filter((i) => i.completed).length;

  const allTasksDone =
    taskWidgetItemsOnly.length > 0 &&
    taskWidgetItemsOnly.every((t) => t.completed);

  const metaStr = taskWidgetItemsOnly.length > 0 && !allTasksDone
    ? `${taskWidgetItemsOnly.filter((i) => !i.completed).length} due · ${Math.round(taskWidgetSpineCompletedPct)}% done`
    : null;

  const clearMessage = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);

  if (allTasksDone) {
    return (
      <div className={styles.taskWidgetSlotAllDoneWrap}>
        <AllTasksCompleteCard
          message={clearMessage}
          sub={`${taskWidgetItemsOnly.length} task${taskWidgetItemsOnly.length !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`}
        >
          <Link to="/tasks?open=fullPlanning" className={styles.taskWidgetPlanTomorrowPill}>
            Plan tomorrow →
          </Link>
        </AllTasksCompleteCard>
      </div>
    );
  }

  return (
    <div ref={taskWidgetRef} className={styles.taskWidgetSlotRoot}>
      {taskWidgetItemsOnly.length > 0 ? (
        <>
          {/* Header row: title + meta (left), donut + count (right) */}
          <div className={styles.taskWidgetSlotHeader}>
            <div className={styles.taskWidgetSlotHeaderLeft}>
              <CheckSquare className={styles.taskWidgetSlotIcon} size={18} strokeWidth={1.5} aria-hidden />
              <div className={styles.taskWidgetSlotTitleBlock}>
                <h3 className={styles.taskWidgetSlotTitle}>Today&apos;s Tasks</h3>
                {metaStr && <span className={styles.taskWidgetSlotMeta}>{metaStr}</span>}
              </div>
            </div>
            <div className={styles.taskWidgetSlotHeaderRight}>
              <div className={styles.taskWidgetDonutWrap}>
                <svg className={styles.taskWidgetDonutSvg} viewBox="0 0 36 36" aria-hidden>
                  <circle className={styles.taskWidgetDonutBg} cx="18" cy="18" r="14" />
                  <circle
                    className={styles.taskWidgetDonutFill}
                    cx="18"
                    cy="18"
                    r="14"
                    strokeDasharray={`${(taskWidgetCompletedCount / taskWidgetItemsOnly.length) * 87.96} 87.96`}
                  />
                </svg>
              </div>
              <span className={styles.taskWidgetDonutCount}>
                {taskWidgetCompletedCount}<span>/{taskWidgetItemsOnly.length} done</span>
              </span>
            </div>
          </div>

          <motion.ul className={styles.taskWidgetTaskList} layout>
            {visibleList.map((t) => {
              const isOverdue = t.taskWidgetStatus === "overdue";
              const isNow = t.taskWidgetStatus === "now";
              const moduleLabel = getTaskCategoryPill ? getTaskCategoryPill(t) : null;

              return (
                <motion.li
                  key={t.id}
                  layout
                  className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${t.completed ? styles.taskWidgetTaskRowDone : ""}`}
                >
                  <button
                    type="button"
                    className={styles.taskWidgetCheckbox}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskWidgetComplete(t);
                    }}
                    aria-label={t.completed ? "Mark incomplete" : `Complete ${t.title}`}
                  >
                    <span
                      className={`${styles.taskWidgetCheckboxCircle} ${
                        t.completed ? styles.taskWidgetCheckboxCircleChecked : ""
                      }`}
                      aria-hidden
                    >
                      {t.completed && "✓"}
                    </span>
                  </button>

                  <span
                    className={`${styles.taskWidgetTaskTitle} ${
                      t.completed ? styles.taskWidgetTaskTitleDone : ""
                    }`}
                    title={t.title}
                  >
                    {t.title}
                  </span>

                  <div className={styles.taskWidgetTaskRight}>
                    {moduleLabel && (
                      <span className={styles.taskWidgetTaskTag}>
                        {moduleLabel}
                      </span>
                    )}
                    {isNow && !t.completed && (
                      <span className={styles.taskWidgetTaskTagNext}>NEXT</span>
                    )}
                    {isOverdue && !t.completed && (
                      <span className={styles.taskWidgetTaskTagLate}>LATE</span>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>

          {hiddenCount > 0 && (
            <button
              type="button"
              className={styles.taskWidgetMoreText}
              onClick={() => setShowAllTaskWidgetTasks((v) => !v)}
            >
              {showAllTaskWidgetTasks ? "Show less" : `+ ${hiddenCount} more`}
            </button>
          )}

          <div className={`${styles.taskWidgetBottomRow} ${styles.taskWidgetManageFooter}`}>
            <Link to="/tasks" className={styles.taskWidgetManageLink}>
              Manage all →
            </Link>
          </div>
        </>
      ) : (
        <EmptyStateCard
          displayName={displayName}
          sub={null}
          message="All caught up for today."
          action={
            <Link to="/tasks" className={styles.taskWidgetLink}>
              Add a task →
            </Link>
          }
        />
      )}
    </div>
  );
}
