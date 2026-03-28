/*
 * Collapsible section for completed tasks.
 */

import { useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import { sortTasks } from "../utils/taskSortUtils";
import { TASK_ROW_ANIM } from "../constants/taskAnimations";
import {
  CollapsibleCountChip,
  CollapsibleSectionBody,
  TaskCardRow,
} from "./TaskSectionShared";

import styles from "./TaskFeedSections.module.css";

function CompletedHeader({ count, showDone, onToggle }) {
  return (
    <button type="button" className={styles.sectionHeader} onClick={onToggle} aria-expanded={showDone}>
      <span className={styles.sectionIcon}>🎯</span>
      <span className={styles.sectionTitle}>Completed</span>
      <CollapsibleCountChip count={count} label={`${count} tasks`} collapsed={!showDone} />
    </button>
  );
}

function CompletedTaskRow({ task, listMap, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  return (
    <TaskCardRow
      task={task}
      listMap={listMap}
      lists={lists}
      onToggleComplete={onToggleComplete}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      cardProps={{ isCompletedSection: true }}
    />
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
      <CollapsibleSectionBody collapsed={!showDone} bodyKey="completed-body">
        <CompletedCardsList sorted={sorted} {...handlers} />
      </CollapsibleSectionBody>
    </div>
  );
}
