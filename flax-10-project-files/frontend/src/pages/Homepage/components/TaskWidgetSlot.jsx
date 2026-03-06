/**
 * Task widget slot — compact flat rows, header ring, no track-status pill.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { CheckSquare } from "lucide-react";
import EmptyStateCard from "./EmptyStateCard";
import AllTasksCompleteCard from "../../Tasks/components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { getModulePillColors } from "./ModulePill";

const VISIBLE_COUNT = 5;

const CATEGORY_COLOURS = {
  UNIVERSITY: { bg: "rgba(123, 163, 196, 0.08)", text: "#4A6D8C" },
  HEALTH:     { bg: "rgba(123, 179, 142, 0.08)", text: "#4A7C5A" },
  PERSONAL:   { bg: "#F5F0E8",                   text: "#736048" },
  WORK:       { bg: "rgba(196, 148, 109, 0.08)", text: "#8C5D3F" },
  FINANCE:    { bg: "rgba(196, 164, 109, 0.08)", text: "#8C6D3F" },
  STUDY:      { bg: "rgba(139, 123, 184, 0.08)", text: "#5B4A8A" },
  default:    { bg: "#F5F0E8",                   text: "#736048" },
};

const MODULE_CODE_RE = /^[A-Z]{2,4}\d{3,4}$/;

function getCategoryStyle(label) {
  if (!label) return CATEGORY_COLOURS.default;
  const key = label.toUpperCase().trim();
  if (MODULE_CODE_RE.test(key)) {
    const c = getModulePillColors(key);
    return { bg: c.bg, text: c.text };
  }
  return CATEGORY_COLOURS[key] || CATEGORY_COLOURS.default;
}

function getEstTime(items) {
  const incomplete = items.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;
  const totalMin = incomplete.reduce((sum, t) => sum + (t.estimated_minutes || 25), 0);
  if (totalMin < 60) return `~${totalMin}m left`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `~${h}h ${m}m left` : `~${h}h left`;
}

const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

export function TaskWidgetSlot({
  styles,
  displayName,
  isToday,
  taskWidgetOverdueCount,
  taskWidgetDueTodayCount = 0,
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
  const incompleteTasks   = taskWidgetList.filter((t) => !t.completed);
  const visibleIncomplete = showAllTaskWidgetTasks
    ? incompleteTasks
    : incompleteTasks.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, incompleteTasks.length - VISIBLE_COUNT);

  const allTasksDone   = taskWidgetItemsOnly.length > 0 && taskWidgetItemsOnly.every((t) => t.completed);
  const clearMessage   = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);
  const incompleteCount = taskWidgetItemsOnly.filter((i) => !i.completed).length;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {allTasksDone ? (
        <motion.div
          key="all-done"
          className={styles.taskWidgetSlotAllDoneWrap}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <AllTasksCompleteCard
            emoji="🎉"
            message={clearMessage}
            sub={`${taskWidgetItemsOnly.length} task${taskWidgetItemsOnly.length !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`}
          >
            <Link to="/tasks?open=fullPlanning" className={styles.taskWidgetPlanTomorrowPill}>
              Plan tomorrow →
            </Link>
          </AllTasksCompleteCard>
        </motion.div>
      ) : (
        <motion.div
          key="tasks"
          ref={taskWidgetRef}
          className={styles.taskWidgetSlotRoot}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {taskWidgetItemsOnly.length > 0 ? (
            <>
              {/* Header */}
              <div className={styles.taskWidgetSlotHeader}>
                <div className={styles.taskWidgetSlotHeaderLeft}>
                  <div className={styles.taskWidgetSlotIconWrap}>
                    <CheckSquare className={styles.taskWidgetSlotIcon} size={17} strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className={styles.taskWidgetSlotTitleBlock}>
                    <h3 className={styles.taskWidgetSlotTitle}>Today&apos;s Tasks</h3>
                  </div>
                </div>
              </div>

              <div className={styles.taskWidgetDueTodayPill}>
                {taskWidgetDueTodayCount} due today
              </div>

              {/* Task list */}
              <motion.ul
                className={styles.taskWidgetTaskList}
                variants={listVariants}
                initial="initial"
                animate="animate"
                layout
              >
                {visibleIncomplete.map((t, idx) => {
                  const status      = t.taskWidgetStatus;
                  const isOverdue   = status === "overdue";
                  const categoryLabel = getTaskCategoryPill ? getTaskCategoryPill(t) : null;
                  const catStyle    = categoryLabel ? getCategoryStyle(categoryLabel) : null;
                  const rowAccent = catStyle?.text || "#8B7355";

                  return (
                    <motion.li
                      key={t.id}
                      layout
                      variants={itemVariants}
                      className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${idx === 0 ? styles.taskWidgetTaskRowNext : ""}`}
                      style={{ "--task-row-accent": rowAccent }}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        className={styles.taskWidgetCheckbox}
                        onClick={(e) => { e.stopPropagation(); handleTaskWidgetComplete(t); }}
                        aria-label={`Complete ${t.title}`}
                      >
                        <motion.span
                          className={styles.taskWidgetCheckboxCircle}
                          aria-hidden
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </button>

                      <div className={styles.taskWidgetTaskBody}>
                        <div className={styles.taskWidgetTaskTopRow}>
                          {categoryLabel && catStyle && (
                            <span
                              className={styles.taskWidgetCategoryPill}
                              style={{ background: "#4A2E1B", color: "#F4ECE3" }}
                            >
                              {categoryLabel}
                            </span>
                          )}
                          {idx === 0 && <span className={styles.taskWidgetNextPill}>Next</span>}
                        </div>
                        <span className={styles.taskWidgetTaskTitle} title={t.title}>
                          {t.title}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}

                {hiddenCount > 0 && (
                  <li>
                    <button
                      type="button"
                      className={styles.taskWidgetMoreText}
                      onClick={() => setShowAllTaskWidgetTasks((v) => !v)}
                    >
                      {showAllTaskWidgetTasks ? "Show less" : `+ ${hiddenCount} more`}
                    </button>
                  </li>
                )}
              </motion.ul>
            </>
          ) : (
            <EmptyStateCard
              sub={null}
              message="All caught up for today."
              action={
                <Link to="/tasks" className={styles.taskWidgetLink}>
                  Add a task →
                </Link>
              }
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
