/**
 * Task widget slot — compact flat rows, header ring, no track-status pill.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CheckSquare, Clock3, Target, ArrowRight, ChevronDown } from "lucide-react";
import EmptyStateCard from "./EmptyStateCard";
import AllTasksCompleteCard from "../../Tasks/components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { getModulePillColors } from "./ModulePill";
import { TaskContextMenu } from "../../Tasks/components/TaskCard";

const VISIBLE_COUNT = 3;

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

function getUrgencyMeta(task) {
  const status = task?.taskWidgetStatus;
  const p = String(task?.priority || "").toLowerCase();
  if (status === "overdue") return { label: "Urgent", tone: "urgent" };
  if (p === "urgent") return { label: "Urgent", tone: "urgent" };
  if (p === "high") return { label: "High", tone: "high" };
  if (status === "now") return { label: "Now", tone: "now" };
  return null;
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
  taskLists = [],
  onEditTask,
  onDeleteTask,
  onInlineTaskEdit,
}) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const incompleteTasks   = taskWidgetList.filter((t) => !t.completed);
  const completedTasks = taskWidgetList.filter((t) => t.completed);
  const visibleIncomplete = showAllTaskWidgetTasks
    ? incompleteTasks
    : incompleteTasks.slice(0, VISIBLE_COUNT);
  const visibleCompleted = completedTasks.slice(0, 3);
  const hiddenCount = Math.max(0, incompleteTasks.length - VISIBLE_COUNT);

  const allTasksDone   = taskWidgetItemsOnly.length > 0 && taskWidgetItemsOnly.every((t) => t.completed);
  const clearMessage   = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);
  const incompleteCount = taskWidgetItemsOnly.filter((i) => !i.completed).length;
  const estimatedLeft = getEstTime(taskWidgetList);

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
                {!hasTimerSession && incompleteCount > 0 && (
                  <button
                    type="button"
                    className={styles.taskWidgetFocusBtn}
                    onClick={onStartFocus}
                  >
                    Focus now
                    <ArrowRight size={12} strokeWidth={1.8} aria-hidden />
                  </button>
                )}
              </div>

              <div className={styles.taskWidgetSummaryRow}>
                <div className={styles.taskWidgetDueTodayPill}>
                  {taskWidgetDueTodayCount} due today
                </div>
                <div className={styles.taskWidgetSummaryPill}>
                  <Target size={11} strokeWidth={1.8} aria-hidden />
                  {incompleteCount} in queue
                </div>
                {estimatedLeft && (
                  <div className={styles.taskWidgetSummaryPill}>
                    <Clock3 size={11} strokeWidth={1.8} aria-hidden />
                    {estimatedLeft}
                  </div>
                )}
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
                  const rowAccent = isOverdue
                    ? "var(--home-urgency-danger)"
                    : "var(--home-urgency-neutral)";
                  const urgency = getUrgencyMeta(t);
                  const categoryLabel = getTaskCategoryPill?.(t);
                  const categoryStyle = getCategoryStyle(categoryLabel);

                  return (
                    <motion.li
                      key={t.id}
                      layout
                      variants={itemVariants}
                      className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${idx === 0 ? styles.taskWidgetTaskRowNext : ""}`}
                      style={{ "--task-row-accent": rowAccent }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCtxMenu({ task: t, x: e.clientX, y: e.clientY });
                      }}
                      title="Right-click for options"
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
                          {categoryLabel && (
                            <span
                              className={styles.taskWidgetCategoryPill}
                              style={{ background: categoryStyle.bg, color: categoryStyle.text }}
                            >
                              {categoryLabel}
                            </span>
                          )}
                          <span className={styles.taskWidgetTaskTitle} title={t.title}>
                            {t.title}
                          </span>
                          {urgency && (
                            <span
                              className={`${styles.taskWidgetUrgencyPill} ${
                                urgency.tone === "urgent"
                                  ? styles.taskWidgetUrgencyPillUrgent
                                  : urgency.tone === "high"
                                    ? styles.taskWidgetUrgencyPillHigh
                                    : styles.taskWidgetUrgencyPillNow
                              }`}
                            >
                              {urgency.label}
                            </span>
                          )}
                        </div>
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

              {visibleCompleted.length > 0 && (
                <div className={styles.taskWidgetCompletedSection}>
                  <button
                    type="button"
                    className={styles.taskWidgetCompletedToggle}
                    onClick={() => setShowCompleted((value) => !value)}
                    aria-expanded={showCompleted}
                  >
                    <span className={styles.taskWidgetCompletedLabel}>Completed</span>
                    <span className={styles.taskWidgetCompletedStats}>
                      <span className={styles.taskWidgetCompletedCount}>
                        {completedTasks.length} done
                      </span>
                      <span className={styles.taskWidgetCompletedChevronWrap} aria-hidden>
                        <motion.span
                          className={styles.taskWidgetCompletedChevron}
                          animate={{ rotate: showCompleted ? 0 : -90 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <ChevronDown size={14} />
                        </motion.span>
                      </span>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {showCompleted && (
                      <motion.ul
                        className={styles.taskWidgetCompletedList}
                        initial={{ height: 0, opacity: 0, y: -4 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -4 }}
                        transition={{
                          height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.18, ease: "easeOut" },
                          y: { duration: 0.18, ease: "easeOut" },
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        {visibleCompleted.map((task) => (
                          <li key={`completed-${task.id}`} className={styles.taskWidgetCompletedRow}>
                            <span className={styles.taskWidgetCompletedCheck} aria-hidden>✓</span>
                            <span className={styles.taskWidgetCompletedTitle} title={task.title}>
                              {task.title}
                            </span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {ctxMenu && (
                <TaskContextMenu
                  task={ctxMenu.task}
                  lists={taskLists}
                  pos={{ x: ctxMenu.x, y: ctxMenu.y }}
                  onClose={() => setCtxMenu(null)}
                  onEditOpen={() => {
                    onEditTask?.(ctxMenu.task);
                    setCtxMenu(null);
                  }}
                  onDelete={async () => {
                    await onDeleteTask?.(ctxMenu.task);
                    setCtxMenu(null);
                  }}
                  onEdit={async (patch) => {
                    await onInlineTaskEdit?.(ctxMenu.task, patch);
                  }}
                />
              )}
            </>
          ) : (
            <EmptyStateCard
              sub={null}
              message="No tasks need attention."
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
