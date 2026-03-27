/*
 * Shared sub-components used across TaskSection, CompletedTasksSection,
 * and SuggestedReadingsSectionParts.
 */

import { AnimatePresence, motion as Motion } from "framer-motion";
import TaskCard from "./TaskCard";
import styles from "./TaskFeedSections.module.css";

/* ── CollapsibleCountChip ──────────────────────────────────────────────────
 * Pill chip that shows a task count and optional extra content (ring, done
 * label). Shrinks to just the count number when collapsed.
 */
export function CollapsibleCountChip({ count, label, collapsed, extraContent }) {
  return (
    <div className={styles.sectionCountWrap}>
      <div className={styles.sectionStatsChip}>
        <AnimatePresence initial={false}>
          {!collapsed && extraContent && (
            <Motion.span
              key="extra"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden" }}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {extraContent}
            </Motion.span>
          )}
        </AnimatePresence>
        <span className={styles.sectionCountPill}>{count}</span>
      </div>
    </div>
  );
}

/* ── CollapsibleSectionBody ────────────────────────────────────────────────
 * Animated expand/collapse wrapper using framer-motion height animation.
 */
export function CollapsibleSectionBody({ collapsed, bodyKey, children }) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <Motion.div
          key={bodyKey}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── TaskCardRow ───────────────────────────────────────────────────────────
 * Resolves list metadata from listMap and renders a TaskCard.
 */
export function TaskCardRow({ task, listMap, lists, onToggleComplete, onDeleteTask, onEditTask, cardProps = {} }) {
  const listEntry = listMap?.[task.list_id];
  const listName = listEntry?.name ?? null;
  const listColor = listEntry?.color ?? null;

  return (
    <TaskCard
      task={task}
      listName={listName}
      listColor={listColor}
      lists={lists}
      onToggle={onToggleComplete ? () => onToggleComplete(task.id) : undefined}
      onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
      onEdit={onEditTask ? (data) => onEditTask(task.id, data) : undefined}
      hideDueBadge={cardProps.hideDueBadge}
      hideListBadge={cardProps.hideListBadge}
      isOverdue={cardProps.isOverdue}
      searchQuery={cardProps.searchQuery}
      isCompletedSection={cardProps.isCompletedSection}
    />
  );
}
