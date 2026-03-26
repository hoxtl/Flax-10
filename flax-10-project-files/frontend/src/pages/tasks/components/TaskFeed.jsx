/*
<<<<<<< HEAD
 * Main container for the task feed page.
 */

import { useMemo } from "react";
=======
 * Main tasks feed with page header, quick add, filters, and sections.
 */

import { Plus } from "lucide-react";

import CreateTaskBar from "./CreateTaskBar";
import TaskSection from "./TaskSection";
import TaskFeedToolbar from "./TaskFeedToolbar";
import CompletedTasksSection from "./CompletedTasksSection";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";

import layoutStyles from "./TaskFeedLayout.module.css";
import toolbarStyles from "./TaskFeedToolbar.module.css";
import sectionStyles from "./TaskFeedSections.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

import TaskFeedContent from "./TaskFeedContent";
import useTaskFeedData from "../hooks/useTaskFeedData";
<<<<<<< HEAD
import { getTaskFeedSubtitle } from "./TaskFeedSubtitle";
import useTaskFeedResponsive from "./useTaskFeedResponsive";
import { isReadingList } from "../utils/readingListUtils";

function getSectionProps(data, props) {
  return {
    ...data.sectionProps,
    onToggleComplete: props.onToggleComplete,
    onDeleteTask: props.onDeleteTask,
    onEditTask: props.onEditTask,
  };
}

function getActiveList(lists, activeListId) {
  return (lists || []).find((list) => String(list.id) === String(activeListId));
}

function getMobileModalData(props) {
  const sidebarProps = props.sidebarProps || {};
  return {
    sidebarProps,
    modalLists: sidebarProps.lists || props.lists || [],
    modalTasks: sidebarProps.tasks || props.tasks || [],
  };
}

function useTaskFeedSubtitle(isMobile, activeList, readingList) {
  return useMemo(
    () => (isMobile ? "" : getTaskFeedSubtitle(activeList, readingList)),
    [isMobile, activeList, readingList],
  );
}

function useTaskFeedViewModel(props) {
  const responsive = useTaskFeedResponsive();
  const data = useTaskFeedData(props);
  const activeList = getActiveList(props.lists, props.activeListId);
  const readingList = isReadingList(activeList);
  const mobileData = getMobileModalData(props);
  const taskFeedSubtitle = useTaskFeedSubtitle(responsive.isMobile, activeList, readingList);

  return {
    ...responsive,
    ...mobileData,
    data,
    activeList,
    readingList,
    sectionPropsWithHandlers: getSectionProps(data, props),
    taskFeedSubtitle,
  };
}

export default function TaskFeed(props) {
  const vm = useTaskFeedViewModel(props);
  return <TaskFeedContent props={props} vm={vm} />;
=======
import SuggestedReadingsSection from "./SuggestedReadingsSection";
import { isReadingList, parseReadingListName } from "../utils/readingListUtils";
import { SECTION_SHOW_LIMIT } from "../constants/taskAnimations";

const styles = { ...layoutStyles, ...toolbarStyles, ...sectionStyles };
const genericTaskFeedSubtitle = (
  <>
    Plan and track your <em>urgent tasks</em>, <em>coursework</em>, <em>admin</em>, and <em>life</em>.
  </>
);

function getTaskFeedSubtitle(activeList, readingList) {
  if (!readingList || !activeList) {
    return genericTaskFeedSubtitle;
  }

  const parsed = parseReadingListName(activeList.name);
  const moduleLabel = parsed.moduleName && parsed.moduleCode
    ? `${parsed.moduleName} (${parsed.moduleCode})`
    : parsed.moduleName || parsed.moduleCode || "this module";

  return (
    <>
      Keep your <em>{moduleLabel}</em> readings, <em>lecture notes</em>, <em>past papers</em>, and <em>revision prep</em> in one place.
    </>
  );
}

function TaskFeedSubHeader({ data, lists, activeListId, defaultDueDateForNewTask, onAddTask, onCreateTask }) {
  const toolbarProps = { search: data.search, onSearchChange: data.setSearch, searchInputRef: data.searchInputRef, sortBy: data.sortBy, onSortChange: data.setSortBy, filterRef: data.filterRef, isFilterOpen: data.isFilterOpen, onFilterOpenChange: data.setIsFilterOpen, activeFilterCount: data.activeFilterCount, activeFilterTab: data.activeFilterTab, onFilterTabChange: data.setActiveFilterTab, filterQuery: data.filterQuery, onFilterQueryChange: data.setFilterQuery, visibleListItems: data.visibleListItems, filterListIds: data.filterListIds, onToggleList: data.toggleListFilter, moduleGroupKeys: data.moduleGroupKeys, groupedVisibleModuleItems: data.groupedVisibleModuleItems, filterModuleCodes: data.filterModuleCodes, onToggleModule: data.toggleModuleFilter, onClearAllFilters: data.clearAllFilters };
  return (
    <div className={styles.subHeader}>
      <div className={styles.createRow}>
        {onAddTask ? <div className={styles.createBarWrap}><CreateTaskBar lists={lists} defaultListId={activeListId} defaultDueDate={defaultDueDateForNewTask} onAddTask={onAddTask} /></div> : <div className={styles.subHeaderSpacer} aria-hidden />}
        {onCreateTask && <PrimaryButton type="button" className={styles.fullPlanBtn} onClick={onCreateTask} pill><Plus size={13} /> Full Planning</PrimaryButton>}
      </div>
      <div className={styles.quickAddDivider} aria-hidden />
      <TaskFeedToolbar {...toolbarProps} />
    </div>
  );
}

function SearchEmptyBlock({ data }) {
  if (!data.showSearchEmptyState) return null;
  return (
    <SearchEmptyState
      query={data.search}
      itemLabel="tasks"
      onClear={() => data.setSearch("")}
    />
  );
}

function OverdueTodaySection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (data.overdue.length === 0 || activeFilter !== "today") return null;
  return <TaskSection title="Overdue" emoji="⚠️" tasks={data.overdue} hideDueBadge isOverdueSection sectionType="overdue" completedCount={0} {...sectionPropsWithHandlers} />;
}

function TodaySection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (activeFilter !== "today") return null;
  return <TaskSection title="Today" emoji="📅" tasks={data.today} hideDueBadge sectionType="today" completedCount={data.completedTodayCount} emptyCardProps={data.todayEmptyCardProps} {...sectionPropsWithHandlers} />;
}

function OverdueFilterSection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (activeFilter !== "overdue") return null;
  return <TaskSection title="Overdue" emoji="⚠️" tasks={data.filtered} sectionType="overdue" completedCount={0} isOverdueSection emptyMessage="No overdue tasks." {...sectionPropsWithHandlers} />;
}

function ThisWeekSection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (activeFilter !== "this_week") return null;
  return (
    <>
      <TaskSection title="Today" emoji="📅" tasks={data.today} hideDueBadge sectionType="today" completedCount={data.completedTodayCount} emptyCardProps={data.todayEmptyCardProps} {...sectionPropsWithHandlers} />
      <TaskSection title="This week" emoji="🗓️" tasks={data.thisWeek} sectionType="thisWeek" completedCount={data.completedWeekCount} emptyMessage="Nothing else due this week." {...sectionPropsWithHandlers} />
    </>
  );
}

function LaterSection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (activeFilter !== "later") return null;
  return <TaskSection title="Later" emoji="⏳" tasks={data.later} sectionType="later" completedCount={data.completedLaterCount} emptyMessage="No tasks due later." {...sectionPropsWithHandlers} />;
}

function AllTasksSection({ data, activeFilter, sectionPropsWithHandlers }) {
  if (["today", "overdue", "this_week", "later"].includes(activeFilter)) return null;
  return (
    <TaskSection
      title="All tasks"
      emoji="📋"
      tasks={data.allTasksCombined}
      sectionType="all"
      completedCount={data.completed.length}
      applyLimit={data.allTasksCombined.length > SECTION_SHOW_LIMIT}
      emptyCardProps={data.allTasksEmptyCardProps}
      emptyMessage={data.allTasksEmptyCardProps ? null : "No tasks yet. Add one above or use Full Planning."}
      {...sectionPropsWithHandlers}
    />
  );
}

function CompletedBlock({ data, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  if (data.filteredCompleted.length === 0) return null;
  return <CompletedTasksSection tasks={data.filteredCompleted} sortBy={data.sortBy} listMap={data.listMap} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />;
}

function TaskFeedPrimarySections({ data, sectionPropsWithHandlers, activeFilter }) {
  return (
    <>
      <OverdueTodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
      <TodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
      <OverdueFilterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
      <ThisWeekSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
      <LaterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
      <AllTasksSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
    </>
  );
}

function ReadingListBlock({ readingList, activeListId, activeList, onTaskAdded, taskCount, data }) {
  if (!readingList || data.search.trim()) return null;
  return <SuggestedReadingsSection key={activeListId} activeList={activeList} onTaskAdded={onTaskAdded} taskCount={taskCount} pendingTasks={data.pending} completedTasks={data.completed} />;
}

function TaskFeedSections({ data, sectionPropsWithHandlers, activeFilter, activeListId, lists, onToggleComplete, onDeleteTask, onEditTask, readingList, activeList, onTaskAdded, taskCount }) {
  return (
    <div className={styles.sectionsWrap}>
      <div className={styles.sections} key={`sections-${activeListId ?? "all"}`}>
        <SearchEmptyBlock data={data} />
        {!data.showSearchEmptyState && <TaskFeedPrimarySections data={data} sectionPropsWithHandlers={sectionPropsWithHandlers} activeFilter={activeFilter} />}
        {!data.showSearchEmptyState && <ReadingListBlock readingList={readingList} activeListId={activeListId} activeList={activeList} onTaskAdded={onTaskAdded} taskCount={taskCount} data={data} />}
        {!data.showSearchEmptyState && <CompletedBlock data={data} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />}
      </div>
    </div>
  );
}

/* Render the main task feed. */
export default function TaskFeed(props) {
  const data = useTaskFeedData(props);
  const sectionPropsWithHandlers = { ...data.sectionProps, onToggleComplete: props.onToggleComplete, onDeleteTask: props.onDeleteTask, onEditTask: props.onEditTask };
  const activeList = (props.lists || []).find((list) => String(list.id) === String(props.activeListId));
  const readingList = isReadingList(activeList);
  const taskFeedSubtitle = getTaskFeedSubtitle(activeList, readingList);
  return (
    <div className={styles.feed}>
      <PageHeader
        title={data.headerTitle}
        subtitle={taskFeedSubtitle}
        compact
      />
      <TaskFeedSubHeader data={data} lists={props.lists} activeListId={props.activeListId} defaultDueDateForNewTask={props.defaultDueDateForNewTask} onAddTask={props.onAddTask} onCreateTask={props.onCreateTask} />
      <TaskFeedSections data={data} sectionPropsWithHandlers={sectionPropsWithHandlers} activeFilter={props.activeFilter} activeListId={props.activeListId} lists={props.lists} onToggleComplete={props.onToggleComplete} onDeleteTask={props.onDeleteTask} onEditTask={props.onEditTask} readingList={readingList} activeList={activeList} onTaskAdded={props.onReloadTasks} taskCount={props.tasks?.length} />
    </div>
  );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
