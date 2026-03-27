/*
 * Shared task feed building blocks.
 */

import { AnimatePresence, motion as Motion } from "framer-motion";
import TaskCard from "./TaskCard";
import styles from "./TaskFeedSections.module.css";

function CollapsibleChipExtra({ collapsed, extraContent }) {
  if (collapsed || !extraContent) return null;
  return (
    <AnimatePresence initial={false}>
      <Motion.span
        key="extra"
        className={styles.chipExtra}
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "auto" }}
        exit={{ opacity: 0, width: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {extraContent}
      </Motion.span>
    </AnimatePresence>
  );
}

/** Collapsible count chip for task section headers. */
export function CollapsibleCountChip({ count, collapsed, extraContent }) {
  return (
    <div className={styles.sectionCountWrap}>
      <div className={styles.sectionStatsChip}>
        <CollapsibleChipExtra collapsed={collapsed} extraContent={extraContent} />
        <span className={styles.sectionCountPill}>{count}</span>
      </div>
    </div>
  );
}

/** Animated section body that expands and collapses vertically. */
export function CollapsibleSectionBody({ collapsed, bodyKey, children }) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed ? (
        <Motion.div
          key={bodyKey}
          className={styles.collapsibleBody}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function getTaskCardListMeta(task, listMap) {
  const listKey = String(task.task_list ?? task.list_id ?? "");
  const listEntry = listKey ? listMap?.[listKey] : null;
  return {
    listColor: listEntry?.color ?? null,
    listName: task.list_name ?? listEntry?.name ?? null,
  };
}

function buildTaskCardHandlers(task, onToggleComplete, onDeleteTask, onEditTask) {
  return {
    onDelete: onDeleteTask ? () => onDeleteTask(task.id) : undefined,
    onEdit: onEditTask ? (data) => onEditTask(task.id, data) : undefined,
    onToggle: onToggleComplete ? () => onToggleComplete(task.id) : undefined,
  };
}

/** Task card row that resolves list metadata before rendering. */
export function TaskCardRow({ task, listMap, lists, onToggleComplete, onDeleteTask, onEditTask, cardProps = {} }) {
  const listMeta = getTaskCardListMeta(task, listMap);
  const handlers = buildTaskCardHandlers(task, onToggleComplete, onDeleteTask, onEditTask);
  return (
    <TaskCard
      task={task}
      {...listMeta}
      lists={lists}
      {...handlers}
      hideDueBadge={cardProps.hideDueBadge}
      hideListBadge={cardProps.hideListBadge}
      isOverdue={cardProps.isOverdue}
      searchQuery={cardProps.searchQuery}
      isCompletedSection={cardProps.isCompletedSection}
    />
  );
}
