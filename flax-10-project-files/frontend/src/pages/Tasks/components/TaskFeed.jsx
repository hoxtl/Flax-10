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
import EstTimeHelpBanner from "../../../components/ui/EstTimeHelpBanner";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";

import layoutStyles from "./TaskFeedLayout.module.css";
import toolbarStyles from "./TaskFeedToolbar.module.css";
import sectionStyles from "./TaskFeedSections.module.css";

import useTaskFeedData from "../hooks/useTaskFeedData";
import { isReadingList } from "../hooks/useCreateTaskBar";
import SuggestedReadingsSection from "./SuggestedReadingsSection";

const styles = { ...layoutStyles, ...toolbarStyles, ...sectionStyles };
const SECTION_SHOW_LIMIT = 8;

function TaskFeedSubHeader({ data, lists, activeListId, defaultDueDateForNewTask, onAddTask, onCreateTask }) {
  const toolbarProps = { search: data.search, onSearchChange: data.setSearch, searchInputRef: data.searchInputRef, sortBy: data.sortBy, onSortChange: data.setSortBy, filterRef: data.filterRef, isFilterOpen: data.isFilterOpen, onFilterOpenChange: data.setIsFilterOpen, activeFilterCount: data.activeFilterCount, activeFilterTab: data.activeFilterTab, onFilterTabChange: data.setActiveFilterTab, filterQuery: data.filterQuery, onFilterQueryChange: data.setFilterQuery, visibleListItems: data.visibleListItems, filterListIds: data.filterListIds, onToggleList: data.toggleListFilter, moduleGroupKeys: data.moduleGroupKeys, groupedVisibleModuleItems: data.groupedVisibleModuleItems, filterModuleCodes: data.filterModuleCodes, onToggleModule: data.toggleModuleFilter, onClearAllFilters: data.clearAllFilters };
  return (
    <div className={styles.subHeader}>
      <div className={styles.bannerRow}>
        <EstTimeHelpBanner message="Not sure how long it'll take? Ask Flax for a suggestion." ctaLabel="Ask Flax" initialMessage="Help me estimate how long this task might take — what time block should I pick?" />
      </div>
      <div className={styles.createRow}>
        {onAddTask ? <div className={styles.createBarWrap}><CreateTaskBar lists={lists} defaultListId={activeListId} defaultDueDate={defaultDueDateForNewTask} onAddTask={onAddTask} /></div> : <div className={styles.subHeaderSpacer} aria-hidden />}
        {onCreateTask && <PrimaryButton type="button" className={styles.addBtn} onClick={onCreateTask} pill><Plus size={13} /> Full Planning</PrimaryButton>}
      </div>
      <div className={styles.quickAddDivider} aria-hidden />
      <TaskFeedToolbar {...toolbarProps} />
    </div>
  );
}

function SearchEmptyBlock({ data }) {
  if (!data.showSearchEmptyState) return null;
  return (
    <div className={styles.searchEmptyCard}>
      <span className={styles.searchEmptyEmoji}>🔍</span>
      <p className={styles.searchEmptyMessage}>No tasks match &ldquo;{data.search}&rdquo;</p>
      <p className={styles.searchEmptyHint}>Try a different keyword or check your spelling</p>
      <PrimaryButton type="button" className={styles.searchEmptyBtn} variant="secondary" size="small" pill onClick={() => data.setSearch("")}>Clear search</PrimaryButton>
    </div>
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
  return <TaskSection title="All tasks" emoji="📋" tasks={data.allTasksCombined} sectionType="all" completedCount={data.completed.length} applyLimit={data.allTasksCombined.length > SECTION_SHOW_LIMIT} emptyMessage="No tasks yet. Add one above or use Full Planning." {...sectionPropsWithHandlers} />;
}

function CompletedBlock({ data, lists, onToggleComplete, onDeleteTask, onEditTask }) {
  if (data.filteredCompleted.length === 0) return null;
  return <CompletedTasksSection tasks={data.filteredCompleted} sortBy={data.sortBy} listMap={data.listMap} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />;
}

function TaskFeedSections({ data, sectionPropsWithHandlers, activeFilter, activeListId, lists, onToggleComplete, onDeleteTask, onEditTask, readingList, onTaskAdded, taskCount }) {
  return (
    <div className={styles.sectionsWrap}>
      <div className={styles.sections} key={`sections-${activeListId ?? "all"}`}>
        <SearchEmptyBlock data={data} />
        <OverdueTodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        <TodaySection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        <OverdueFilterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        <ThisWeekSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        <LaterSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        <AllTasksSection data={data} activeFilter={activeFilter} sectionPropsWithHandlers={sectionPropsWithHandlers} />
        {readingList && (
        <SuggestedReadingsSection key={activeListId} onTaskAdded={onTaskAdded} taskCount={taskCount} />
      )}
        <CompletedBlock data={data} lists={lists} onToggleComplete={onToggleComplete} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
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
        subtitle="Plan coursework, deadlines, and day-to-day admin in one place."
      />
      <TaskFeedSubHeader data={data} lists={props.lists} activeListId={props.activeListId} defaultDueDateForNewTask={props.defaultDueDateForNewTask} onAddTask={props.onAddTask} onCreateTask={props.onCreateTask} />
      <TaskFeedSections data={data} sectionPropsWithHandlers={sectionPropsWithHandlers} activeFilter={props.activeFilter} activeListId={props.activeListId} lists={props.lists} onToggleComplete={props.onToggleComplete} onDeleteTask={props.onDeleteTask} onEditTask={props.onEditTask} 
      readingList={readingList} onTaskAdded={props.onReloadTasks} taskCount={props.tasks?.length}
      />
    </div>
  );
}
