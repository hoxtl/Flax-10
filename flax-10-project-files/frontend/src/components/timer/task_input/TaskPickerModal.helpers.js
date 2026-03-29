/*
 * Shared helper functions for the timer task picker modal.
 */

/*
 * Builds the filter panel configuration from picker state.
 */

export function buildFilterPanelProps(state) {
  return {
    activeFilterTab: state.activeFilterTab,
    onTabChange: state.setActiveFilterTab,
    filterQuery: state.filterQuery,
    onQueryChange: state.setFilterQuery,
    visibleListItems: state.visibleListItems,
    filterListIds: state.filterListIds,
    onToggleList: (listId) => toggleList(listId, state.setFilterListIds),
    moduleGroupKeys: state.moduleGroupKeys,
    groupedModuleItems: state.groupedModuleItems,
    filterModuleCodes: state.filterModuleCodes,
    onToggleModule: (code) => toggleModule(code, state.setFilterModuleCodes),
    onClearAll: () => clearAllFilters(state),
  };
}

/*
 * Applies a new sort selection and reloads the task list.
 */

export function changeSort(value, state) {
  state.setSortBy(value);
  state.loadTasks(value);
}

/*
 * Toggles a task list filter in the active selection.
 */

export function toggleList(listId, setFilterListIds) {
  const stringId = String(listId);
  setFilterListIds((previous) => previous.includes(stringId) ? previous.filter((id) => id !== stringId) : [...previous, stringId]);
}

/*
 * Toggles a module filter in the active selection.
 */

export function toggleModule(code, setFilterModuleCodes) {
  setFilterModuleCodes((previous) => previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code]);
}

/*
 * Clears every active picker filter.
 */

export function clearAllFilters(state) {
  state.setFilterListIds([]);
  state.setFilterModuleCodes([]);
  state.setFilterQuery('');
}

/*
 * Closes the filter panel when a click lands outside it.
 */

export function closeFilterPanel(event, state, filterWrapRef) {
  if (state.isFilterOpen && filterWrapRef.current && !filterWrapRef.current.contains(event.target)) state.setIsFilterOpen(false);
}
