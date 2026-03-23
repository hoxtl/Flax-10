/*
 * Task feed toolbar shell.
 */

import ToolbarFilterPanel from "./TaskFeedToolbarFilter";
import {
  ToolbarSearch,
  ToolbarSort,
  ToolbarViewLists,
} from "./TaskFeedToolbarParts";

import styles from "./TaskFeedToolbar.module.css";

function buildPanelProps(props) {
  return {
    activeFilterTab: props.activeFilterTab,
    onTabChange: props.onFilterTabChange,
    filterQuery: props.filterQuery,
    onQueryChange: props.onFilterQueryChange,
    visibleListItems: props.visibleListItems,
    filterListIds: props.filterListIds,
    onToggleList: props.onToggleList,
    moduleGroupKeys: props.moduleGroupKeys,
    groupedModuleItems: props.groupedVisibleModuleItems,
    filterModuleCodes: props.filterModuleCodes,
    onToggleModule: props.onToggleModule,
    onClearAll: props.onClearAllFilters,
  };
}

function ToolbarControls({ props, panelProps }) {
  return (
    <div className={styles.controlsRow}>
      <ToolbarSort sortBy={props.sortBy} onSortChange={props.onSortChange} />
      <ToolbarFilterPanel
        filterAnchor={props.filterAnchor}
        isFilterOpen={props.isFilterOpen}
        onFilterOpenChange={props.onFilterOpenChange}
        activeFilterCount={props.activeFilterCount}
        panelProps={panelProps}
      />
      <ToolbarViewLists onOpenLists={props.onOpenLists} />
    </div>
  );
}

export default function TaskFeedToolbar(props) {
  const panelProps = buildPanelProps(props);

  return (
    <div className={styles.toolbarStrip}>
      <div className={styles.toolbar}>
        <ToolbarSearch
          search={props.search}
          onSearchChange={props.onSearchChange}
          searchInputRef={props.searchInputRef}
        />
        <ToolbarControls props={props} panelProps={panelProps} />
      </div>
    </div>
  );
}
