/*
 * Collapsible task group with progress and optional empty state.
 */

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import TaskCard from "./TaskCard";
import AllTasksCompleteCard from "./AllTasksCompleteCard";
import { sortTasks } from "../utils/taskSortUtils";
import { getListColor } from "../utils/listColorUtils";
import { SECTION_SHOW_LIMIT, TASK_ROW_ANIM, SECTION_BODY_ANIM } from "../constants/taskAnimations";

import styles from "./TaskFeedSections.module.css";

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

function SectionStatsChip({ totalInGroup, progressPct, isOverdue, collapsed, tasks, completedCount }) {
  return (
    <span className={styles.sectionStatsChip}>
      <span className={styles.sectionCountWrap}>
        {totalInGroup > 0 && <ProgressRing progressPct={progressPct} isOverdue={isOverdue} />}
        <span className={styles.sectionCountPill} aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
        {completedCount > 0 && (
          <span className={`${styles.sectionCountDone} ${collapsed ? styles.sectionCountDoneMuted : ""}`}>· {completedCount} done</span>
        )}
      </span>
      <span className={styles.sectionChevronBtn} aria-hidden>
        <Motion.span className={styles.sectionChevron} animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          <ChevronDown size={16} />
        </Motion.span>
      </span>
    </span>
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
      <SectionStatsChip totalInGroup={totalInGroup} progressPct={progressPct} isOverdue={isOverdue} collapsed={collapsed} tasks={tasks} completedCount={completedCount} />
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

function ShowMoreButton({ showAll, hiddenCount, onToggle }) {
  return (
    <div className={styles.showMoreWrap}>
      <button type="button" className={styles.showMoreBtn} onClick={onToggle}>{showAll ? "Show less ↑" : `+ Show ${hiddenCount} more`}</button>
    </div>
  );
}

function SectionBody({ tasks: visibleTasks, showAll, applyLimit, hiddenCount, emptyState, sectionTaskRowProps }) {
  if (emptyState) return emptyState;
  return (
    <>
      <AnimatePresence initial={false}>
        {visibleTasks.map(task => (
          <Motion.div key={task.id} layout {...TASK_ROW_ANIM}>
            <SectionTaskRow task={task} {...sectionTaskRowProps} />
          </Motion.div>
        ))}
      </AnimatePresence>
      {applyLimit && hiddenCount > 0 && <ShowMoreButton showAll={showAll} hiddenCount={hiddenCount} onToggle={sectionTaskRowProps.onToggleShowAll} />}
    </>
  );
}

function useTaskSectionState(props) {
  const [collapsed, setCollapsed] = useState(props.defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => sortTasks(props.tasks, props.sortBy, props.listMap), [props.tasks, props.sortBy, props.listMap]);
  const totalInGroup = props.tasks.length + props.completedCount;
  const progressPct = totalInGroup > 0 ? Math.round((props.completedCount / totalInGroup) * 100) : 0;
  const visibleTasks = props.applyLimit && !showAll ? sorted.slice(0, SECTION_SHOW_LIMIT) : sorted;
  const hiddenCount = props.applyLimit ? Math.max(0, sorted.length - SECTION_SHOW_LIMIT) : 0;
  const isEmpty = props.tasks.length === 0;
  const showEmptyState = isEmpty && (props.emptyMessage != null || props.emptyCardProps != null);
  const emptyState = showEmptyState ? <SectionEmptyState sectionType={props.sectionType} emptyMessage={props.emptyMessage} emptySub={props.emptySub} emptyCardProps={props.emptyCardProps} /> : null;
  const sectionTaskRowProps = { listMap: props.listMap, lists: props.lists, onToggleComplete: props.onToggleComplete, onDeleteTask: props.onDeleteTask, onEditTask: props.onEditTask, hideDueBadge: props.hideDueBadge, hideListBadge: props.hideListBadge, isOverdueSection: props.isOverdueSection, searchQuery: props.searchQuery, onToggleShowAll: () => setShowAll((v) => !v) };
  return { collapsed, setCollapsed, showAll, totalInGroup, progressPct, visibleTasks, hiddenCount, isEmpty, showEmptyState, emptyState, sectionTaskRowProps };
}

/* A collapsible group of tasks with a title, emoji, progress ring, and optional empty state. */
export default function TaskSection(props) {
  const state = useTaskSectionState(props);
  if (state.isEmpty && !state.showEmptyState && props.completedCount === 0) return null;
  const accentCls = props.isOverdueSection ? styles.sectionAccentDanger : "";
  return (
    <div className={`${styles.section} ${accentCls} ${props.isOverdueSection ? styles.sectionOverdue : ""}`}>
      <SectionHeader title={props.title} emoji={props.emoji} isOverdue={props.isOverdueSection} collapsed={state.collapsed} tasks={props.tasks} completedCount={props.completedCount} totalInGroup={state.totalInGroup} progressPct={state.progressPct} onToggle={() => state.setCollapsed((c) => !c)} />
      <AnimatePresence initial={false}>
        {!state.collapsed && (
          <Motion.div key="section-body" {...SECTION_BODY_ANIM} style={{ overflow: "hidden" }}>
            <div className={styles.sectionBody}>
              <SectionBody tasks={state.visibleTasks} showAll={state.showAll} applyLimit={props.applyLimit} hiddenCount={state.hiddenCount} emptyState={state.emptyState} sectionTaskRowProps={state.sectionTaskRowProps} />
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
