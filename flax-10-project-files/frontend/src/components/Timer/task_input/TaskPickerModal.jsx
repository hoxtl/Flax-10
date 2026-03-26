/*
 * Timer task picker modal.
 */

import styles from '../../../pages/timer/TimerPage.module.css';
import SearchBar from '../../common/search_bar/SearchBar';
import SearchEmptyState from '../../common/search_empty_state/SearchEmptyState';
import SkeletonBlock from '../../common/loading_state/SkeletonBlock';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import StandardModal from '../../common/standard_modal/StandardModal';
import AnimatedDropdown from '../../common/animated_dropdown';
import ToolbarFilterPanel from '../../../pages/tasks/components/TaskFeedToolbarFilter';
import taskToolbarStyles from '../../../pages/tasks/components/TaskFeedToolbar.module.css';
import { SORT_OPTIONS } from './taskInputConstants';
import { TaskPickItem } from './TaskPickItem';

function TaskPickerLoading() {
  return (
    <div className={styles.taskPickLoadingState}>
      <div className={styles.taskPickLoadingHeader}>
        <SkeletonBlock className={styles.taskPickLoadingTitle} />
        <SkeletonBlock className={styles.taskPickLoadingMeta} />
      </div>
      {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className={styles.taskPickLoadingRow} />)}
    </div>
  );
}

function ModalHeader({ setOpen }) {
  return (
    <div className={styles.taskPickHeader}>
      <div className={styles.taskPickHeaderCopy}><h2 className={styles.taskPickHeaderTitle}>Select a Task</h2></div>
      <button type="button" className={styles.taskPickCloseBtn} onClick={() => setOpen(false)} aria-label="Close task picker">×</button>
    </div>
  );
}

function SmartPickButton({ onPickForMe }) {
  return <PrimaryButton variant="primary" pill className={styles.taskPickSmartBtn} onClick={onPickForMe}>✦ Smart Pick — choose a task for me</PrimaryButton>;
}

function buildFilterPanelProps(state) {
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

function Toolbar({ state, filterWrapRef, activeFilterCount, onPickForMe }) {
  const filterPanelProps = buildFilterPanelProps(state);

  return (
    <div className={styles.taskPickFiltersBar}>
      <div className={styles.taskPickToolbarRow}>
        <SearchBar value={state.search} onChange={state.setSearch} placeholder="Search tasks…" className={styles.taskPickSearch} />
        <div className={styles.taskPickSortWrap}><AnimatedDropdown value={state.sortBy} onChange={(value) => changeSort(value, state)} options={SORT_OPTIONS} className={taskToolbarStyles.sortDropdown} /></div>
        <div className={styles.taskPickFilterSlot}><ToolbarFilterPanel filterAnchor={filterWrapRef} isFilterOpen={state.isFilterOpen} onFilterOpenChange={state.setIsFilterOpen} activeFilterCount={activeFilterCount} panelProps={filterPanelProps} /></div>
      </div>
      <SmartPickButton onPickForMe={onPickForMe} />
    </div>
  );
}

function changeSort(value, state) {
  state.setSortBy(value);
  state.loadTasks(value);
}

function toggleList(listId, setFilterListIds) {
  const stringId = String(listId);
  setFilterListIds((previous) => previous.includes(stringId) ? previous.filter((id) => id !== stringId) : [...previous, stringId]);
}

function toggleModule(code, setFilterModuleCodes) {
  setFilterModuleCodes((previous) => previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code]);
}

function clearAllFilters(state) {
  state.setFilterListIds([]);
  state.setFilterModuleCodes([]);
  state.setFilterQuery('');
}

function TaskResults({ state, onSelect }) {
  if (state.loading) return <div className={styles.taskPickResults}><TaskPickerLoading /></div>;
  if (state.filteredTasks.length === 0) return <div className={styles.taskPickResults}><SearchEmptyState query={state.search} itemLabel="tasks" hint={state.search.trim() ? 'Try a different keyword.' : undefined} onClear={state.search.trim() ? () => state.setSearch('') : undefined} /></div>;
  return <div className={styles.taskPickResults}><div className={styles.taskPickList}>{state.filteredTasks.map((task) => <TaskPickItem key={task.id} task={task} selectedTaskId={state.selectedTaskId} recommendedTaskId={state.recommendedTaskId} onSelect={onSelect} />)}</div></div>;
}

export function TaskPickerModal({ state, filterWrapRef, onSelect, onPickForMe }) {
  const activeFilterCount = state.filterListIds.length + state.filterModuleCodes.length;
  const backdropClassName = !state.open ? styles.hidden : styles.taskPickBackdrop;
  const modalClassName = !state.open ? styles.hidden : styles.taskPickDropdown;

  return (
    <StandardModal onClose={() => state.setOpen(false)} size="lg" hideHeader backdropClassName={backdropClassName} modalClassName={modalClassName} contentClassName={styles.taskPickContent}>
      {state.open && <div className={styles.taskPickShell} onMouseDown={(event) => closeFilterPanel(event, state, filterWrapRef)}><ModalHeader setOpen={state.setOpen} /><Toolbar state={state} filterWrapRef={filterWrapRef} activeFilterCount={activeFilterCount} onPickForMe={onPickForMe} /><TaskResults state={state} onSelect={onSelect} /></div>}
    </StandardModal>
  );
}

function closeFilterPanel(event, state, filterWrapRef) {
  if (state.isFilterOpen && filterWrapRef.current && !filterWrapRef.current.contains(event.target)) state.setIsFilterOpen(false);
}
