<<<<<<< HEAD
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import WidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import widgetStyles from "../../modules/DashboardWidgets.module.css";
import rowStyles from "../../modules/DashboardRows.module.css";
import { TaskContextMenu } from "../../tasks/components/TaskCard";
import { TaskWidgetRow } from "./TaskWidgetRow";
import { TaskWidgetAllDone, TaskWidgetCompletedSection, TaskWidgetEmpty } from "./TaskWidgetSections";
import { ShowMoreButton } from "../../../components/modules/shared/widgetParts.jsx";
import { useTaskWidgetState } from "./useTaskWidgetState";
import {
  expandBodyVariants,
  listVariants,
} from "../../../components/modules/shared/widgetVariants.js";

const styles = { ...widgetStyles, ...rowStyles };
=======
/**
 * Task widget slot — compact flat rows, header ring, no track-status pill.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useRef, useCallback } from "react";
import { CheckSquare, Clock3, Target, ArrowRight, ChevronDown } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import EmptyStateCard from "./EmptyStateCard";
import AllTasksCompleteCard from "../../Tasks/components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { getModulePillColors } from "./ModulePill";
import { TaskContextMenu } from "../../Tasks/components/TaskCard";
import InlineTitleField, { useInlineEdit } from "../../../components/common/InlineTitleField/InlineTitleField";

const VISIBLE_COUNT = 3;

const CATEGORY_COLOURS = {
  UNIVERSITY: { bg: "color-mix(in srgb, #4A6D8C 35%, transparent)", text: "#7FA7C2" },
  HEALTH:     { bg: "color-mix(in srgb, #D97A65 35%, transparent)", text: "#E2907E" },
  INTERNSHIPS: { bg: "color-mix(in srgb, var(--color-primary) 35%, transparent)", text: "var(--color-primary)" },
  WORK:       { bg: "color-mix(in srgb, #4F6D8A 35%, transparent)", text: "#7FA7C2" },
  PERSONAL:   { bg: "color-mix(in srgb, var(--color-primary) 35%, transparent)", text: "var(--color-primary)" },
  FINANCE:    { bg: "color-mix(in srgb, #B57A42 35%, transparent)", text: "#E3B285" },
  default:    { bg: "color-mix(in srgb, var(--color-primary) 30%, transparent)", text: "var(--color-primary)" },
};

const MODULE_CODE_RE = /^[A-Z]{2,4}\d{3,4}$/;

function getCategoryStyle(label) {
  if (!label) return CATEGORY_COLOURS.default;
  const key = label.toUpperCase().trim();
  
  const isDark = document.documentElement.getAttribute('data-mode') === 'dark';
  let style = CATEGORY_COLOURS[key] || CATEGORY_COLOURS.default;
  
  if (isDark) {
    // In dark mode, we force the text to be a very light tint of the color for maximum pop
    // And increase background opacity to ground it better
    return {
      bg: style.bg.replace('35%', '42%').replace('30%', '42%'),
      text: "#FFFFFF"
    };
  } else {
    // Light mode: use a darker version of the theme primary or the specific text color
    return {
      bg: style.bg,
      text: "var(--color-primary-strong)"
    };
  }
  
  if (MODULE_CODE_RE.test(key)) {
    const c = getModulePillColors(key);
    return { bg: c.bg, text: c.text };
  }
  return style;
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

/** Individual task row with inline title editing */
function TaskRow({ task, idx, styles, isOverdue, urgency, categoryLabel, categoryStyle, rowAccent, handleTaskWidgetComplete, onInlineTaskEdit, setCtxMenu }) {
  const edit = useInlineEdit(task.title, (newTitle) => onInlineTaskEdit?.(task, { title: newTitle }));
  return (
    <motion.li
      layout
      variants={itemVariants}
      className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${idx === 0 ? styles.taskWidgetTaskRowNext : ""}`}
      style={{ "--task-row-accent": rowAccent }}
      onContextMenu={(e) => {
        e.preventDefault();
        setCtxMenu({ task, x: e.clientX, y: e.clientY });
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        className={styles.taskWidgetCheckbox}
        onClick={(e) => { e.stopPropagation(); handleTaskWidgetComplete(task); }}
        aria-label={`Complete ${task.title}`}
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
          <span className={styles.taskWidgetTaskTitle}>
            <InlineTitleField
              value={task.title}
              isEditing={edit.isEditing}
              draft={edit.draft}
              setDraft={edit.setDraft}
              onStart={edit.start}
              onSave={edit.save}
              onCancel={edit.cancel}
            />
          </span>
          {urgency && !edit.isEditing && (
            <span
              className={`${styles.taskWidgetUrgencyPill} ${urgency.tone === "urgent"
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
  row = 1,
}) {
  const navigate = useNavigate();
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const incompleteTasks = taskWidgetList.filter((t) => !t.completed);
  const completedTasks = taskWidgetList.filter((t) => t.completed);

  const visibleLimit = row === 1 ? 3 : 6;
  const visibleIncomplete = incompleteTasks.slice(0, visibleLimit);
  const visibleCompleted = completedTasks.slice(0, 3);
  const hiddenCount = Math.max(0, incompleteTasks.length - visibleLimit);

  const allTasksDone = taskWidgetItemsOnly.length > 0 && taskWidgetItemsOnly.every((t) => t.completed);
  const clearMessage = useMemo(() => (allTasksDone ? getClearMessage() : null), [allTasksDone]);
  const incompleteCount = taskWidgetItemsOnly.filter((i) => !i.completed).length;
  const estimatedLeft = getEstTime(taskWidgetList);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function TaskWidgetSlot(props) {
  const data = useTaskWidgetState(props);
  return (
    <AnimatePresence mode="wait" initial={false}>
<<<<<<< HEAD
      {data.allTasksDone
        ? <TaskWidgetAllDone itemCount={props.taskWidgetItemsOnly.length} styles={props.styles} />
        : <TaskWidgetCard {...props} {...data} />}
=======
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
              <div className={baseStyles.widgetHeader}>
                <div className={baseStyles.headerIconWrap}>
                  <CheckSquare className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className={baseStyles.headerTitle}>Today&apos;s Tasks</h3>
                
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
                  const status = t.taskWidgetStatus;
                  const isOverdue = status === "overdue";
                  const rowAccent = isOverdue
                    ? "var(--home-urgency-danger)"
                    : "var(--home-urgency-neutral)";
                  const urgency = getUrgencyMeta(t);
                  const categoryLabel = getTaskCategoryPill?.(t);
                  const categoryStyle = getCategoryStyle(categoryLabel);

                  return (
                    <TaskRow
                      key={t.id}
                      task={t}
                      idx={idx}
                      styles={styles}
                      isOverdue={isOverdue}
                      urgency={urgency}
                      categoryLabel={categoryLabel}
                      categoryStyle={categoryStyle}
                      rowAccent={rowAccent}
                      handleTaskWidgetComplete={handleTaskWidgetComplete}
                      onInlineTaskEdit={onInlineTaskEdit}
                      setCtxMenu={setCtxMenu}
                    />
                  );
                })}

                {hiddenCount > 0 && (
                  <li>
                    <button
                      type="button"
                      className={styles.taskWidgetMoreText}
                      onClick={() => navigate("/tasks?filter=today")}
                    >
                      + {hiddenCount} more · View all tasks
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </AnimatePresence>
  );
}

function TaskWidgetCard(props) {
  const { styles: taskStyles, taskWidgetItemsOnly, taskWidgetRef, ...contentProps } = props;
  return (
    <Motion.div
      key="tasks"
      ref={taskWidgetRef}
      className={taskStyles.taskWidgetSlotRoot}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {taskWidgetItemsOnly.length > 0 ? (
        <TaskWidgetContent styles={taskStyles} taskWidgetItemsOnly={taskWidgetItemsOnly} {...contentProps} />
      ) : (
        <TaskWidgetEmpty styles={taskStyles} />
      )}
    </Motion.div>
  );
}

function TaskWidgetContent(props) {
  return (
    <div className={props.styles.taskWidgetContent}>
      <TaskWidgetHeaderSection styles={props.styles} count={props.taskWidgetDueTodayCount} />
      <TaskWidgetList {...props} />
      <TaskWidgetCompletedSection {...props} />
      <TaskWidgetMenu {...props} />
    </div>
  );
}

function TaskWidgetHeaderSection({ styles: s, count }) {
  return (
    <WidgetHeader
      icon={CheckSquare}
      title="Today's Tasks"
      count={count}
      actions={<GoToTasksButton styles={s} />}
      className={s.taskWidgetWidgetHeader}
    />
  );
}

function GoToTasksButton({ styles: s }) {
  const navigate = useNavigate();
  return (
    <PrimaryButton
      type="button"
      size="small"
      pill
      onClick={() => navigate("/tasks?filter=today")}
      className={s.taskWidgetHeaderButton}
    >
      Go to all tasks
    </PrimaryButton>
  );
}

function ExpandedTaskRows({ extraTasks, ...props }) {
  return (
    <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
      <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
        {extraTasks.map((task) => <TaskListRow key={task.id} task={task} {...props} />)}
      </Motion.div>
    </Motion.div>
  );
}

function TaskWidgetList(props) {
  return (
    <Motion.div className={`${styles.widgetList} ${props.styles.taskWidgetWidgetList}`} initial="hidden" animate="visible" variants={listVariants}>
      {props.initialTasks.map((task, index) => <TaskListRow key={task.id} task={task} index={index} {...props} />)}
      <AnimatePresence initial={false}>
        {props.expanded && <ExpandedTaskRows extraTasks={props.extraTasks} {...props} />}
      </AnimatePresence>
      {props.extraTasks.length > 0 && <ShowMoreButton expanded={props.expanded} hiddenCount={props.extraTasks.length} onToggle={() => props.setExpanded((prev) => !prev)} styles={styles} />}
    </Motion.div>
  );
}

function TaskListRow(props) {
  const isLeadTask = props.index === 0;
  return (
    <TaskWidgetRow
      {...props}
      isOverdue={props.task.taskWidgetStatus === "overdue"}
      rowAccent={getRowAccent(props.task, isLeadTask)}
      urgentGlow={isLeadTask || props.task.taskWidgetUrgentGlow}
    />
  );
}

function getRowAccent(task, isLeadTask = false) {
  const priority = String(task?.priority || "").toLowerCase();
  if (isLeadTask || task.taskWidgetStatus === "overdue" || priority === "urgent") return "var(--home-urgency-danger)";
  if (priority === "high" || priority === "medium") return "var(--home-urgency-warning)";
  return "var(--home-urgency-neutral)";
}

function TaskWidgetMenu({ ctxMenu, onDeleteTask, onEditTask, onInlineTaskEdit, setCtxMenu, taskLists }) {
  if (!ctxMenu) return null;
  return (
    <TaskContextMenu
      task={ctxMenu.task}
      lists={taskLists}
      pos={{ x: ctxMenu.x, y: ctxMenu.y }}
      onClose={() => setCtxMenu(null)}
      onEditOpen={() => openEdit(ctxMenu, onEditTask, setCtxMenu)}
      onDelete={() => deleteTask(ctxMenu, onDeleteTask, setCtxMenu)}
      onEdit={(patch) => onInlineTaskEdit?.(ctxMenu.task, patch)}
    />
  );
}


function openEdit(ctxMenu, onEditTask, setCtxMenu) {
  onEditTask?.(ctxMenu.task);
  setCtxMenu(null);
}

async function deleteTask(ctxMenu, onDeleteTask, setCtxMenu) {
  await onDeleteTask?.(ctxMenu.task);
  setCtxMenu(null);
}
