/**
 * Task feed page: header, quick add, toolbar, and collapsible sections.
 * Composes TaskFeedHeader, TaskFeedSubHeader, TaskFeedSections to meet line limit.
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

import useTaskFeedData from "../hooks/useTaskFeedData";
import SuggestedReadingsSection from "./SuggestedReadingsSection";
import { isReadingList } from "../utils/readingListUtils";

const styles = { ...layoutStyles, ...toolbarStyles, ...sectionStyles };
const SECTION_SHOW_LIMIT = 8;
const taskFeedSubtitle = (
  <>
    Plan and track your <em>urgent tasks</em>, <em>coursework</em>, <em>admin</em>, and <em>life</em>.
  </>
);

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

function TaskFeedSections({ data, sectionPropsWithHandlers, activeFilter, activeListId, lists, onToggleComplete, onDeleteTask, onEditTask, readingList, activeList, onTaskAdded, taskCount }) {
  return (
    <div className={styles.sectionsWrap}>
      <div className={styles.sections} key={`sections-${activeListId ?? "all"}`}>
        <SearchEmptyBlock data={data} />
        {data.showSearchEmptyState ? null : (
          <>
            <OverdueTodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            <TodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            <OverdueFilterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            <ThisWeekSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            <LaterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            <AllTasksSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
            {readingList && !data.search.trim() && (
              <SuggestedReadingsSection
                key={activeListId}
                activeList={activeList}
                onTaskAdded={onTaskAdded}
                taskCount={taskCount}
                pendingTasks={data.pending}
                completedTasks={data.completed}
              />
            )}
            <CompletedBlock data={data} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the main task feed.
 */
export default function TaskFeed(props) {
  const data = useTaskFeedData(props);
  const sectionPropsWithHandlers = { ...data.sectionProps, onToggleComplete: props.onToggleComplete, onDeleteTask: props.onDeleteTask, onEditTask: props.onEditTask };
  const activeList = (props.lists || []).find(l => String(l.id) === String(props.activeListId));
  const readingList = isReadingList(activeList);
  return (
    <div className={styles.feed}>
      <PageHeader
        title={data.headerTitle}
        subtitle={taskFeedSubtitle}
        compact
      />
      <TaskFeedSubHeader data={data} lists={props.lists} activeListId={props.activeListId} defaultDueDateForNewTask={props.defaultDueDateForNewTask} onAddTask={props.onAddTask} onCreateTask={props.onCreateTask} />
      <TaskFeedSections data={data} sectionPropsWithHandlers={sectionPropsWithHandlers} activeFilter={props.activeFilter} activeListId={props.activeListId} lists={props.lists} onToggleComplete={props.onToggleComplete} onDeleteTask={props.onDeleteTask} onEditTask={props.onEditTask}
      readingList={readingList} activeList={activeList} onTaskAdded={props.onReloadTasks} taskCount={props.tasks?.length}
      />
    </div>
  );
}
