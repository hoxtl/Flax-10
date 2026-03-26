/*
 * Quick-add and toolbar area beneath the task feed page header.
 */

import { Plus } from "lucide-react";

import AnimatedDropdown from "../../../components/common/animated_dropdown";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";

import CreateTaskBar from "./CreateTaskBar";
import TaskFeedToolbar from "./TaskFeedToolbar";
import { MOBILE_VIEW_OPTIONS } from "./TaskFeedConstants";

import styles from "./TaskFeedLayout.module.css";

function buildFilterProps(data) {
  return {
    filterAnchor: data.filterRef,
    isFilterOpen: data.isFilterOpen,
    onFilterOpenChange: data.setIsFilterOpen,
    activeFilterCount: data.activeFilterCount,
    activeFilterTab: data.activeFilterTab,
    onFilterTabChange: data.setActiveFilterTab,
    filterQuery: data.filterQuery,
    onFilterQueryChange: data.setFilterQuery,
    visibleListItems: data.visibleListItems,
    filterListIds: data.filterListIds,
    onToggleList: data.toggleListFilter,
    moduleGroupKeys: data.moduleGroupKeys,
    groupedVisibleModuleItems: data.groupedVisibleModuleItems,
    filterModuleCodes: data.filterModuleCodes,
    onToggleModule: data.toggleModuleFilter,
    onClearAllFilters: data.clearAllFilters,
  };
}

function buildToolbarProps(data, onOpenLists) {
  return {
    search: data.search,
    onSearchChange: data.setSearch,
    searchInputRef: data.searchInputRef,
    sortBy: data.sortBy,
    onSortChange: data.setSortBy,
    ...buildFilterProps(data),
    onOpenLists,
  };
}

function handleMobileFilterChange(nextFilter, onSelectList, onSelectFilter) {
  onSelectList?.(null);
  onSelectFilter?.(nextFilter);
}

function MobileViewSelect({ activeFilter, onSelectFilter, onSelectList }) {
  return (
    <AnimatedDropdown
      className={styles.mobileViewDropdown}
      value={activeFilter}
      onChange={(nextFilter) => handleMobileFilterChange(nextFilter, onSelectList, onSelectFilter)}
      options={MOBILE_VIEW_OPTIONS}
    />
  );
}

function MobileViewRow(props) {
  if (!props.isMobile) return null;

  return (
    <div className={styles.mobileViewRow}>
      <div className={styles.mobileViewSelectWrap}>
        <span className={styles.mobileViewLabel}>View</span>
        <MobileViewSelect {...props} />
      </div>
    </div>
  );
}

function FullPlanButton({ onCreateTask, isMobile }) {
  if (!onCreateTask) return null;

  return (
    <PrimaryButton type="button" className={styles.fullPlanBtn} onClick={onCreateTask} pill>
      <Plus size={13} /> {isMobile ? "Plan" : "Full Planning"}
    </PrimaryButton>
  );
}

function CreateBar(props) {
  if (!props.onAddTask) return <div className={styles.subHeaderSpacer} aria-hidden />;

  return (
    <div className={styles.createBarWrap}>
      <CreateTaskBar
        lists={props.lists}
        defaultListId={props.activeListId}
        defaultDueDate={props.defaultDueDateForNewTask}
        onAddTask={props.onAddTask}
      />
    </div>
  );
}

function TaskFeedQuickAdd(props) {
  return (
    <div className={styles.createRow}>
      <CreateBar {...props} />
      <FullPlanButton onCreateTask={props.onCreateTask} isMobile={props.isMobile} />
    </div>
  );
}

export default function TaskFeedSubHeader(props) {
  const toolbarProps = buildToolbarProps(props.data, props.onOpenLists);

  return (
    <div className={styles.subHeader}>
      <MobileViewRow {...props} />
      <TaskFeedQuickAdd {...props} />
      <div className={styles.quickAddDivider} aria-hidden />
      <TaskFeedToolbar {...toolbarProps} />
    </div>
  );
}
