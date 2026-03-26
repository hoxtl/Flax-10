import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, ArrowRight, Target, Clock3, ChevronDown } from "lucide-react";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { getCategoryStyle, getUrgencyMeta } from "./TaskWidgetUtils";
import styles from "../styles/TaskWidget.module.css";

export const listVariants = { animate: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } } };
export const itemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

export const TaskSlotHeader = ({ hasTimerSession, incompleteCount, onStartFocus }) => (
  <div className={styles.taskWidgetSlotHeader}>
    <HeaderLeft />
    {!hasTimerSession && incompleteCount > 0 && <FocusButton onClick={onStartFocus} />}
  </div>
);

const HeaderLeft = () => (
  <div className={styles.taskWidgetSlotHeaderLeft}>
    <div className={styles.taskWidgetSlotIconWrap}><CheckSquare className={styles.taskWidgetSlotIcon} size={17} strokeWidth={1.75} aria-hidden /></div>
    <div className={styles.taskWidgetSlotTitleBlock}><h3 className={styles.taskWidgetSlotTitle}>Today's Tasks</h3></div>
  </div>
);

const FocusButton = ({ onClick }) => (
  <PrimaryButton type="button" className={styles.taskWidgetFocusBtn} onClick={onClick} variant="primary" size="small" pill>
    Focus now <ArrowRight size={12} strokeWidth={1.8} aria-hidden />
  </PrimaryButton>
);

export const TaskSummaryRow = ({ dueCount, incompleteCount, estimatedLeft }) => (
  <div className={styles.taskWidgetSummaryRow}>
    <div className={styles.taskWidgetDueTodayPill}>{dueCount} due today</div>
    <SummaryPill icon={<Target size={11} strokeWidth={1.8} />} text={`${incompleteCount} in queue`} />
    {estimatedLeft && <SummaryPill icon={<Clock3 size={11} strokeWidth={1.8} />} text={estimatedLeft} />}
  </div>
);

const SummaryPill = ({ icon, text }) => (
  <div className={styles.taskWidgetSummaryPill}>{icon}{text}</div>
);

export const TaskRow = ({ task, index, getTaskCategoryPill, handleTaskWidgetComplete, onContextMenu }) => {
  const isOverdue = task.taskWidgetStatus === "overdue";
  const rowAccent = isOverdue ? "var(--home-urgency-danger)" : "var(--home-urgency-neutral)";
  const urgency = getUrgencyMeta(task);
  const catLabel = getTaskCategoryPill?.(task);
  const catStyle = getCategoryStyle(catLabel);

  return (
    <motion.li
      layout variants={itemVariants} style={{ "--task-row-accent": rowAccent }}
      className={`${styles.taskWidgetTaskRow} ${isOverdue ? styles.taskWidgetTaskRowOverdue : ""} ${index === 0 ? styles.taskWidgetTaskRowNext : ""}`}
      onContextMenu={(e) => onContextMenu(e, task)} title="Right-click for options"
    >
      <Checkbox task={task} onComplete={handleTaskWidgetComplete} />
      <TaskBody task={task} catLabel={catLabel} catStyle={catStyle} urgency={urgency} />
    </motion.li>
  );
};

const Checkbox = ({ task, onComplete }) => (
  <button type="button" className={styles.taskWidgetCheckbox} onClick={(e) => { e.stopPropagation(); onComplete(task); }} aria-label={`Complete ${task.title}`}>
    <motion.span className={styles.taskWidgetCheckboxCircle} aria-hidden animate={{ scale: 1 }} transition={{ duration: 0.2 }} />
  </button>
);

const TaskBody = ({ task, catLabel, catStyle, urgency }) => (
  <div className={styles.taskWidgetTaskBody}>
    <div className={styles.taskWidgetTaskTopRow}>
      {catLabel && <span className={styles.taskWidgetCategoryPill} style={{ background: catStyle.bg, color: catStyle.text }}>{catLabel}</span>}
      <span className={styles.taskWidgetTaskTitle} title={task.title}>{task.title}</span>
      {urgency && <UrgencyPill urgency={urgency} />}
    </div>
  </div>
);

const UrgencyPill = ({ urgency }) => (
  <span className={`${styles.taskWidgetUrgencyPill} ${styles[`taskWidgetUrgencyPill${urgency.tone.charAt(0).toUpperCase() + urgency.tone.slice(1)}`]}`}>
    {urgency.label}
  </span>
);

export const CompletedSection = ({ showCompleted, setShowCompleted, completedTasks, visibleCompleted }) => (
  <div className={styles.taskWidgetCompletedSection}>
    <CompletedToggle show={showCompleted} onClick={() => setShowCompleted(!showCompleted)} count={completedTasks.length} />
    <AnimatePresence initial={false}>
      {showCompleted && <CompletedList tasks={visibleCompleted} />}
    </AnimatePresence>
  </div>
);

const CompletedToggle = ({ show, onClick, count }) => (
  <button type="button" className={styles.taskWidgetCompletedToggle} onClick={onClick} aria-expanded={show}>
    <span className={styles.taskWidgetCompletedLabel}>Completed</span>
    <span className={styles.taskWidgetCompletedStats}>
      <span className={styles.taskWidgetCompletedCount}>{count} done</span>
      <ChevronIcon show={show} />
    </span>
  </button>
);

const ChevronIcon = ({ show }) => (
  <span className={styles.taskWidgetCompletedChevronWrap} aria-hidden>
    <motion.span className={styles.taskWidgetCompletedChevron} animate={{ rotate: show ? 0 : -90 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <ChevronDown size={14} />
    </motion.span>
  </span>
);

const CompletedList = ({ tasks }) => (
  <motion.ul
    className={styles.taskWidgetCompletedList}
    initial={{ height: 0, opacity: 0, y: -4 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -4 }}
    transition={{ height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.18 }, y: { duration: 0.18 } }}
    style={{ overflow: "hidden" }}
  >
    {tasks.map((task) => (
      <li key={`completed-${task.id}`} className={styles.taskWidgetCompletedRow}>
        <span className={styles.taskWidgetCompletedCheck} aria-hidden>✓</span>
        <span className={styles.taskWidgetCompletedTitle} title={task.title}>{task.title}</span>
      </li>
    ))}
  </motion.ul>
);
