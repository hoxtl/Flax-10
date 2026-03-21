/*
 * Task feed toolbar with search, sort, and filter controls.
 */

import { X } from "lucide-react";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import SearchBar from "../../../components/common/SearchBar";
import TaskFeedFilterPanel from "./TaskFeedFilterPanel";
import styles from "./TaskFeedToolbar.module.css";

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "due", label: "Due date" },
  { value: "alpha", label: "A → Z" },
  { value: "alpha-desc", label: "Z → A" },
  { value: "date_added", label: "Date added" },
  { value: "est_time", label: "Estimated time" },
];

function ToolbarSearch({ search, onSearchChange, searchInputRef }) {
  return (
    <div className={styles.searchWrap}>
      <SearchBar
        ref={searchInputRef}
        className={styles.searchField}
        inputClassName={styles.searchInput}
        placeholder="search by list or task..."
        value={search}
        onChange={onSearchChange}
        aria-label="Search tasks"
        onKeyDown={(e) => { if (e.key === "Escape") { onSearchChange(""); e.target.blur(); } }}
      />
      {search && <button type="button" className={styles.searchClear} onClick={() => onSearchChange("")} aria-label="Clear search"><X size={12} /></button>}
    </div>
  );
}

function ToolbarSort({ sortBy, onSortChange }) {
  return (
    <div className={styles.sortWrap}>
      <label className={styles.sortLabel}>SORT</label>
      <AnimatedDropdown value={sortBy} onChange={onSortChange} options={SORT_OPTIONS} className={styles.sortDropdown} />
    </div>
  );
}

function buildFilterProps(props) {
  return {
    containerRef: props.filterRef,
    isOpen: props.isFilterOpen,
    onToggle: () => props.onFilterOpenChange((open) => !open),
    activeFilterCount: props.activeFilterCount,
    activeFilterTab: props.activeFilterTab,
    onTabChange: props.onFilterTabChange,
    filterQuery: props.filterQuery,
    onFilterQueryChange: props.onFilterQueryChange,
    visibleListItems: props.visibleListItems,
    filterListIds: props.filterListIds,
    onToggleList: props.onToggleList,
    groupedVisibleModuleItems: props.groupedVisibleModuleItems,
    moduleGroupKeys: props.moduleGroupKeys,
    filterModuleCodes: props.filterModuleCodes,
    onToggleModule: props.onToggleModule,
    onClearAll: props.onClearAllFilters,
  };
}

function ToolbarFilters(props) {
  return <TaskFeedFilterPanel {...buildFilterProps(props)} />;
}

export default function TaskFeedToolbar(props) {
  return (
    <div className={styles.toolbarStrip}>
      <div className={styles.toolbar}>
        <ToolbarSearch search={props.search} onSearchChange={props.onSearchChange} searchInputRef={props.searchInputRef} />
        <ToolbarSort sortBy={props.sortBy} onSortChange={props.onSortChange} />
        <ToolbarFilters {...props} />
      </div>
    </div>
  );
}
