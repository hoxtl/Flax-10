/*
 * Shared helpers for collapsible task feed sections.
 */

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import TaskCard from "./TaskCard";
import { getListColor } from "../utils/listColorUtils";
import { isReadingList } from "../utils/readingListUtils";
import { SECTION_BODY_ANIM } from "../constants/taskAnimations";

import styles from "./TaskFeedSections.module.css";

function buildEditHandler(list, onEditTask, taskId) {
  if (isReadingList(list) || !onEditTask) return undefined;
  return (data, meta) => onEditTask(taskId, data, meta);
}

function getTaskCardProps(task, list, lists, onToggleComplete, onDeleteTask, onEditTask, cardProps) {
  return {
    task,
    listName: list?.name,
    listColor: getListColor(list, list?.idx),
    lists,
    onToggle: () => onToggleComplete(task.id, task.completed),
    onDelete: () => onDeleteTask(task.id),
    onEdit: buildEditHandler(list, onEditTask, task.id),
    ...cardProps,
  };
}

export function CollapsibleCountChip({ count, label, collapsed, extraContent }) {
  return (
    <span className={styles.sectionStatsChip}>
      <span className={styles.sectionCountWrap}>
        <span className={styles.sectionCountPill} aria-label={label}>{count}</span>
        {extraContent}
      </span>
      <span className={styles.sectionChevronBtn} aria-hidden>
        <Motion.span
          className={styles.sectionChevron}
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronDown size={16} />
        </Motion.span>
      </span>
    </span>
  );
}

export function TaskCardRow({
  task,
  listMap,
  lists,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  cardProps,
}) {
  const list = listMap[String(task.task_list)];
  const taskCardProps = getTaskCardProps(task, list, lists, onToggleComplete, onDeleteTask, onEditTask, cardProps);
  return (
    <div className={styles.taskRow}>
      <TaskCard {...taskCardProps} />
    </div>
  );
}

export function CollapsibleSectionBody({ collapsed, bodyKey, children, className }) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <Motion.div
          key={bodyKey}
          {...SECTION_BODY_ANIM}
          className={className}
          style={{ overflow: "hidden" }}
        >
          {children}
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
