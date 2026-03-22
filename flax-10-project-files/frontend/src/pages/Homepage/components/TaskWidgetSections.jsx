/**
 * Task widget sections.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import AllTasksCompleteCard from "../../Tasks/components/AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import EmptyStateCard from "./EmptyStateCard";

export function TaskWidgetAllDone({ itemCount, styles }) {
  return (
    <motion.div key="all-done" className={styles.taskWidgetSlotAllDoneWrap} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <AllTasksCompleteCard emoji="🎉" message={getClearMessage()} sub={buildDoneCopy(itemCount)}>
        <Link to="/tasks?open=fullPlanning" className={styles.taskWidgetPlanTomorrowPill}>Plan tomorrow →</Link>
      </AllTasksCompleteCard>
    </motion.div>
  );
}

function buildDoneCopy(itemCount) {
  return `${itemCount} task${itemCount !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`;
}

export function TaskWidgetEmpty({ styles }) {
  return <EmptyStateCard sub={null} message="No tasks need attention." action={<Link to="/tasks" className={styles.taskWidgetLink}>Add a task →</Link>} />;
}

export function TaskWidgetHiddenLink({ hiddenCount, styles }) {
  if (hiddenCount <= 0) return null;
  return <li><Link to="/tasks?filter=today" className={styles.taskWidgetMoreText}>+ {hiddenCount} more · View all tasks</Link></li>;
}

export function TaskWidgetCompletedSection(props) {
  if (props.visibleCompleted.length === 0) return null;
  return (
    <div className={props.styles.taskWidgetCompletedSection}>
      <CompletedToggle {...props} />
      <AnimatePresence initial={false}>{props.showCompleted && <CompletedList {...props} />}</AnimatePresence>
    </div>
  );
}

function CompletedToggle({ completedTasks, setShowCompleted, showCompleted, styles }) {
  return (
    <button type="button" className={styles.taskWidgetCompletedToggle} onClick={() => setShowCompleted((value) => !value)} aria-expanded={showCompleted}>
      <span className={styles.taskWidgetCompletedLabel}>Completed</span>
      <span className={styles.taskWidgetCompletedStats}><span className={styles.taskWidgetCompletedCount}>{completedTasks.length} done</span><Chevron showCompleted={showCompleted} styles={styles} /></span>
    </button>
  );
}

function Chevron({ showCompleted, styles }) {
  return (
    <span className={styles.taskWidgetCompletedChevronWrap} aria-hidden>
      <motion.span className={styles.taskWidgetCompletedChevron} animate={{ rotate: showCompleted ? 0 : -90 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        <ChevronDown size={14} />
      </motion.span>
    </span>
  );
}

function CompletedList({ styles, visibleCompleted }) {
  return (
    <motion.ul className={styles.taskWidgetCompletedList} initial={{ height: 0, opacity: 0, y: -4 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -4 }} transition={completedTransition} style={{ overflow: "hidden" }}>
      {visibleCompleted.map((task) => <CompletedRow key={`completed-${task.id}`} styles={styles} task={task} />)}
    </motion.ul>
  );
}

function CompletedRow({ styles, task }) {
  return <li className={styles.taskWidgetCompletedRow}><span className={styles.taskWidgetCompletedCheck} aria-hidden>✓</span><span className={styles.taskWidgetCompletedTitle} title={task.title}>{task.title}</span></li>;
}

const completedTransition = {
  height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  opacity: { duration: 0.18, ease: "easeOut" },
  y: { duration: 0.18, ease: "easeOut" },
};
