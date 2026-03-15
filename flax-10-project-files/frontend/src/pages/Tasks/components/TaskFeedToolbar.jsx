/**
 * Toolbar for TaskFeed: search, sort, and filter. Composed from small components.
 */

import { X, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import SearchBar from "../../../components/common/SearchBar";
import TaskFilterPanel from "./TaskFilterPanel";
import styles from "./TaskFeedToolbar.module.css";

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "due", label: "Due date" },
  { value: "alpha", label: "A → Z" },
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

function ToolbarFilterPanel({ filterRef, isFilterOpen, onFilterOpenChange, activeFilterCount, panelProps }) {
  return (
    <div className={styles.filterPanelWrap} ref={filterRef}>
      <button type="button" className={styles.filterBtn} onClick={() => onFilterOpenChange((o) => !o)} aria-haspopup="dialog" aria-expanded={isFilterOpen}>
        <Filter size={14} /><span>Filter</span>
        {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
      </button>
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div className={styles.filterPanel} role="dialog" aria-label="Task filters" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ originY: 0, originX: 1 }}>
            <TaskFilterPanel {...panelProps} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TaskFeedToolbar(props) {
  const panelProps = { activeFilterTab: props.activeFilterTab, onTabChange: props.onFilterTabChange, filterQuery: props.filterQuery, onQueryChange: props.onFilterQueryChange, visibleListItems: props.visibleListItems, filterListIds: props.filterListIds, onToggleList: props.onToggleList, moduleGroupKeys: props.moduleGroupKeys, groupedModuleItems: props.groupedVisibleModuleItems, filterModuleCodes: props.filterModuleCodes, onToggleModule: props.onToggleModule, onClearAll: props.onClearAllFilters };
  return (
    <div className={styles.toolbarStrip}>
      <div className={styles.toolbar}>
        <ToolbarSearch search={props.search} onSearchChange={props.onSearchChange} searchInputRef={props.searchInputRef} />
        <ToolbarSort sortBy={props.sortBy} onSortChange={props.onSortChange} />
        <ToolbarFilterPanel filterRef={props.filterRef} isFilterOpen={props.isFilterOpen} onFilterOpenChange={props.onFilterOpenChange} activeFilterCount={props.activeFilterCount} panelProps={panelProps} />
      </div>
    </div>
  );
}
