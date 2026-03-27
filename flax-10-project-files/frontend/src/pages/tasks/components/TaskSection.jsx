/*
 * Collapsible task group with progress and optional empty state.
 */

import { useState, useMemo } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import AllTasksCompleteCard from "./AllTasksCompleteCard";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState.jsx";
import { sortTasks } from "../utils/taskSortUtils";
import { SECTION_SHOW_LIMIT, TASK_ROW_ANIM } from "../constants/taskAnimations";
import {
  CollapsibleCountChip,
  CollapsibleSectionBody,
  TaskCardRow,
} from "./TaskSectionShared";

import styles from "./TaskFeedSections.module.css";

function ProgressRing({ progressPct, isOverdue }) {
  const circumference = 2 * Math.PI * 9;
  return (
    <svg className={styles.sectionRing} width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="9" fill="none" className={styles.sectionRingBg} strokeWidth="2.5" />
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
  const doneCount = completedCount > 0
    ? <span className={`${styles.sectionCountDone} ${collapsed ? styles.sectionCountDoneMuted : ""}`}>· {completedCount} done</span>
    : null;
  return (
    <>
      <CollapsibleCountChip
        count={tasks.length}
        label={`${tasks.length} tasks`}
        collapsed={collapsed}
        extraContent={totalInGroup > 0 ? <ProgressRing progressPct={progressPct} isOverdue={isOverdue} /> : null}
      />
      {doneCount}
    </>
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

function SectionEmptyState({ sectionType, emptyMessage, emptySub, emptyCardProps, useSearchEmpty }) {
  const emoji = (sectionType === "all" || sectionType === "overdue") ? "🗂️" : "✨";
  if (emptyCardProps) {
    return <AllTasksCompleteCard emoji="🎉" message={emptyCardProps.message} sub={emptyCardProps.sub} ctaLabel={emptyCardProps.ctaLabel} onCtaClick={emptyCardProps.onCtaClick} />;
  }
  if (useSearchEmpty) {
    return <SearchEmptyState query="" itemLabel="tasks" title="No tasks yet" hint="Add one above or use Full Planning." />;
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
  return (
    <TaskCardRow
      task={task}
      listMap={listMap}
      lists={lists}
      onToggleComplete={onToggleComplete}
      onDeleteTask={onDeleteTask}
      onEditTask={onEditTask}
      cardProps={{
        hideDueBadge,
        hideListBadge,
        isOverdue: isOverdueSection,
        searchQuery,
      }}
    />
  );
}

function ShowMoreButton({ showAll, totalCount, onToggle }) {
  const showAllLabel = `+ Show all ${totalCount}`;
  return (
    <div className={styles.showMoreWrap}>
      <button type="button" className={styles.showMoreBtn} onClick={onToggle}>{showAll ? "Show less ↑" : showAllLabel}</button>
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
      {applyLimit && hiddenCount > 0 && <ShowMoreButton showAll={showAll} totalCount={visibleTasks.length + hiddenCount} onToggle={sectionTaskRowProps.onToggleShowAll} />}
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
  const showEmptyState = isEmpty && (props.emptyMessage != null || props.emptyCardProps != null || props.useSearchEmptyState);
  const emptyState = showEmptyState ? <SectionEmptyState sectionType={props.sectionType} emptyMessage={props.emptyMessage} emptySub={props.emptySub} emptyCardProps={props.emptyCardProps} useSearchEmpty={props.useSearchEmptyState} /> : null;
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
      <CollapsibleSectionBody collapsed={state.collapsed} bodyKey="section-body">
        <div className={styles.sectionBody}>
          <SectionBody tasks={state.visibleTasks} showAll={state.showAll} applyLimit={props.applyLimit} hiddenCount={state.hiddenCount} emptyState={state.emptyState} sectionTaskRowProps={state.sectionTaskRowProps} />
        </div>
      </CollapsibleSectionBody>
    </div>
  );
}
