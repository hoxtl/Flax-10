/**
 * Collapsible section that groups tasks under a heading with a progress ring.
 */

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TaskCard from "./TaskCard";
import AllTasksCompleteCard from "./AllTasksCompleteCard";
import { sortTasks } from "../utils/taskSortUtils";
import { getListColor } from "../utils/listColorUtils";

import styles from "./TaskFeed.module.css";

const SECTION_SHOW_LIMIT = 8;

const SECTION_BODY_ANIM = {
  initial:    { height: 0, opacity: 0, y: -4 },
  animate:    { height: "auto", opacity: 1, y: 0 },
  exit:       { height: 0, opacity: 0, y: -4 },
  transition: { height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2, ease: "easeOut" }, y: { duration: 0.2, ease: "easeOut" } },
};

function ProgressRing({ progressPct, isOverdue }) {
  const circumference = 2 * Math.PI * 9;
  return (
    <svg className={styles.sectionRing} width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(123,103,81,0.1)" strokeWidth="2.5" />
      <circle cx="11" cy="11" r="9" fill="none"
        className={`${styles.sectionRingFill} ${isOverdue ? styles.sectionRingDanger : ""}`}
        strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${(circumference * progressPct) / 100} ${circumference}`}
        transform="rotate(-90 11 11)"
      />
    </svg>
  );
}

function SectionHeader({ title, emoji, isOverdue, collapsed, tasks, completedCount, totalInGroup, progressPct, onToggle }) {
  return (
    <button
      type="button"
      className={`${styles.sectionHeader} ${isOverdue ? styles.sectionHeaderDanger : ""}`}
      onClick={onToggle}
      aria-expanded={!collapsed}
    >
      <span className={styles.sectionIcon}>{emoji}</span>
      <span className={styles.sectionTitle}>{title}</span>
      <span className={styles.sectionStatsChip}>
        <span className={styles.sectionCountWrap}>
          {totalInGroup > 0 && <ProgressRing progressPct={progressPct} isOverdue={isOverdue} />}
          <span className={styles.sectionCountPill} aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
          {completedCount > 0 && (
            <span className={`${styles.sectionCountDone} ${collapsed ? styles.sectionCountDoneMuted : ""}`}>· {completedCount} done</span>
          )}
        </span>
        <span className={styles.sectionChevronBtn} aria-hidden>
          <motion.span className={styles.sectionChevron} animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <ChevronDown size={16} />
          </motion.span>
        </span>
      </span>
    </button>
  );
}

function SectionEmptyState({ sectionType, emptyMessage, emptySub, emptyCardProps }) {
  const emoji = (sectionType === "all" || sectionType === "overdue") ? "🗂️" : "✨";
  if (emptyCardProps) {
    return <AllTasksCompleteCard emoji="🎉" message={emptyCardProps.message} sub={emptyCardProps.sub} ctaLabel={emptyCardProps.ctaLabel} onCtaClick={emptyCardProps.onCtaClick} />;
  }
  return (
    <div className={styles.sectionEmptyState}>
      <span className={styles.sectionEmptyIcon} aria-hidden>{emoji}</span>
      <p className={styles.sectionEmptyMessage}>{emptyMessage}</p>
      {emptySub && <p className={styles.sectionEmptySub}>{emptySub}</p>}
    </div>
  );
}

function SectionTaskRow({ task, listMap, lists, onToggleComplete, onDeleteTask, onEditTask, hideDueBadge, hideListBadge, isOverdueSection, searchQuery }) {
  const list = listMap[String(task.task_list)];
  return (
    <div className={styles.taskRow}>
      <TaskCard
        task={task}
        listName={list?.name}
        listColor={getListColor(list, list?.idx)}
        lists={lists}
        onToggle={() => onToggleComplete(task.id, task.completed)}
        onDelete={() => onDeleteTask(task.id)}
        onEdit={(data, meta) => onEditTask(task.id, data, meta)}
        hideDueBadge={hideDueBadge}
        hideListBadge={hideListBadge}
        isOverdue={isOverdueSection}
        searchQuery={searchQuery}
      />
    </div>
  );
}

function SectionBody({ tasks: visibleTasks, showAll, applyLimit, hiddenCount, emptyState, sectionTaskRowProps }) {
  if (emptyState) return emptyState;
  return (
    <>
      {visibleTasks.map(task => <SectionTaskRow key={task.id} task={task} {...sectionTaskRowProps} />)}
      {applyLimit && hiddenCount > 0 && (
        <div className={styles.showMoreWrap}>
          <button type="button" className={styles.showMoreBtn} onClick={sectionTaskRowProps.onToggleShowAll}>
            {showAll ? "Show less ↑" : `Show all ${visibleTasks.length + hiddenCount} →`}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * A collapsible group of tasks with a title, emoji, progress ring, and optional empty state.
 *
 * @param {object} props
 */
export default function TaskSection({
  title, emoji, tasks, sortBy, listMap, lists,
  onToggleComplete, onDeleteTask, onEditTask,
  defaultCollapsed = false, hideDueBadge = false,
  isOverdueSection = false, hideListBadge = false,
  completedCount = 0, sectionType = "default",
  applyLimit = false, searchQuery = "",
  emptyMessage = null, emptySub = null, emptyCardProps = null,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showAll,   setShowAll]   = useState(false);
  const sorted = useMemo(() => sortTasks(tasks, sortBy, listMap), [tasks, sortBy, listMap]);

  const totalInGroup = tasks.length + completedCount;
  const progressPct  = totalInGroup > 0 ? Math.round((completedCount / totalInGroup) * 100) : 0;
  const visibleTasks = applyLimit && !showAll ? sorted.slice(0, SECTION_SHOW_LIMIT) : sorted;
  const hiddenCount  = applyLimit ? Math.max(0, sorted.length - SECTION_SHOW_LIMIT) : 0;

  const isEmpty        = tasks.length === 0;
  const showEmptyState = isEmpty && (emptyMessage != null || emptyCardProps != null);
  if (isEmpty && !showEmptyState && completedCount === 0) return null;

  const accentCls = isOverdueSection ? styles.sectionAccentDanger : "";
  const emptyState = showEmptyState
    ? <SectionEmptyState sectionType={sectionType} emptyMessage={emptyMessage} emptySub={emptySub} emptyCardProps={emptyCardProps} />
    : null;

  return (
    <div className={`${styles.section} ${accentCls} ${isOverdueSection ? styles.sectionOverdue : ""}`}>
      <SectionHeader title={title} emoji={emoji} isOverdue={isOverdueSection} collapsed={collapsed} tasks={tasks} completedCount={completedCount} totalInGroup={totalInGroup} progressPct={progressPct} onToggle={() => setCollapsed(c => !c)} />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div key="section-body" {...SECTION_BODY_ANIM} style={{ overflow: "hidden" }}>
            <div className={styles.sectionBody}>
              <SectionBody tasks={visibleTasks} showAll={showAll} applyLimit={applyLimit} hiddenCount={hiddenCount} emptyState={emptyState}
                sectionTaskRowProps={{ listMap, lists, onToggleComplete, onDeleteTask, onEditTask, hideDueBadge, hideListBadge, isOverdueSection, searchQuery, onToggleShowAll: () => setShowAll(v => !v) }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
