/*
 * Collapsible section for completed tasks.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import TaskCard from "./TaskCard";
import { sortTasks } from "../utils/taskSortUtils";
import { getListColor } from "../utils/listColorUtils";
import { isReadingList } from "../utils/readingListUtils";
import { TASK_ROW_ANIM, SECTION_BODY_ANIM } from "../constants/taskAnimations";

import styles from "./TaskFeedSections.module.css";

function CompletedHeader({ count, showDone, onToggle }) {
  return (
    <button type="button" className={styles.sectionHeader} onClick={onToggle} aria-expanded={showDone}>
      <span className={styles.sectionIcon}>🎯</span>
      <span className={styles.sectionTitle}>Completed</span>
      <span className={styles.sectionStatsChip}>
        <span className={styles.sectionCountWrap}>
          <span className={styles.sectionCountPill} aria-label={`${count} tasks`}>{count}</span>
        </span>
        <span className={styles.sectionChevronBtn} aria-hidden>
          <Motion.span className={styles.sectionChevron} animate={{ rotate: showDone ? 0 : -90 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <ChevronDown size={16} />
          </Motion.span>
        </span>
      </span>
    </button>
  );
}

function CompletedTaskRow({ task, listMap, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  const list = listMap[String(task.task_list)];
  const editHandler = !isReadingList(list) && onEditTask ? (data, meta) => onEditTask(task.id, data, meta) : undefined;
  return (
    <div className={styles.taskRow}>
      <TaskCard task={task} listName={list?.name} listColor={getListColor(list, list?.idx)} lists={lists} onToggle={() => onToggleComplete(task.id, task.completed)} onDelete={() => onDeleteTask(task.id)} onEdit={editHandler} isCompletedSection />
    </div>
  );
}

function CompletedCardsList({ sorted, listMap, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  return (
    <div className={styles.completedCards}>
      <AnimatePresence initial={false}>
        {sorted.map(task => (
          <Motion.div key={task.id} layout {...TASK_ROW_ANIM}>
            <CompletedTaskRow task={task} listMap={listMap} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
          </Motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* Renders a collapsible list of completed tasks. */
export default function CompletedTasksSection({ tasks, sortBy, listMap, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  const [showDone, setShowDone] = useState(true);
  if (tasks.length === 0) return null;
  const sorted = sortTasks(tasks, sortBy, listMap);
  const handlers = { listMap, lists, onToggleComplete, onDeleteTask, onEditTask };
  return (
    <div className={`${styles.completedSection} ${styles.sectionAccentDone}`}>
      <CompletedHeader count={tasks.length} showDone={showDone} onToggle={() => setShowDone(s => !s)} />
      <AnimatePresence initial={false}>
        {showDone && (
          <Motion.div key="completed-body" {...SECTION_BODY_ANIM} style={{ overflow: "hidden" }}>
            <CompletedCardsList sorted={sorted} {...handlers} />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
