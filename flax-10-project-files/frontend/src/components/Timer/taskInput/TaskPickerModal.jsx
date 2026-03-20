/*
 * Timer task picker modal.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import SearchBar from '../../common/SearchBar/SearchBar';
import SearchEmptyState from '../../common/SearchEmptyState/SearchEmptyState';
import SkeletonBlock from '../../common/LoadingState/SkeletonBlock';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import StandardModal from '../../common/StandardModal/StandardModal';
import AnimatedDropdown from '../../common/AnimatedDropdown';
import TaskFeedFilterPanel from '../../../pages/Tasks/components/TaskFeedFilterPanel';
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

function Toolbar({ state, activeFilterCount, onPickForMe }) {
  return (
    <div className={styles.taskPickFiltersBar}>
      <div className={styles.taskPickToolbarRow}>
        <SearchBar value={state.search} onChange={state.setSearch} placeholder="Search tasks…" className={styles.taskPickSearch} />
        <div className={styles.taskPickSortWrap}><AnimatedDropdown value={state.sortBy} onChange={(value) => changeSort(value, state)} options={SORT_OPTIONS} className={styles.taskPickSortDropdown} /></div>
        <div ref={state.filterWrapRef}><TaskFeedFilterPanel isOpen={state.isFilterOpen} onToggle={() => state.setIsFilterOpen((value) => !value)} activeFilterCount={activeFilterCount} activeFilterTab={state.activeFilterTab} onTabChange={state.setActiveFilterTab} filterQuery={state.filterQuery} onFilterQueryChange={state.setFilterQuery} visibleListItems={state.visibleListItems} filterListIds={state.filterListIds} onToggleList={(listId) => toggleList(listId, state.setFilterListIds)} groupedVisibleModuleItems={state.groupedModuleItems} moduleGroupKeys={state.moduleGroupKeys} filterModuleCodes={state.filterModuleCodes} onToggleModule={(code) => toggleModule(code, state.setFilterModuleCodes)} onClearAll={() => clearAllFilters(state)} /></div>
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

function TaskResults({ state, value, onSelect }) {
  if (state.loading) return <TaskPickerLoading />;
  if (state.filteredTasks.length === 0) return <SearchEmptyState query={state.search} itemLabel="tasks" hint={state.search.trim() ? 'Try a different keyword.' : undefined} onClear={state.search.trim() ? () => state.setSearch('') : undefined} />;
  return <div className={styles.taskPickList}>{state.filteredTasks.map((task) => <TaskPickItem key={task.id} task={task} value={value} recommendedTaskId={state.recommendedTaskId} onSelect={onSelect} />)}</div>;
}

export function TaskPickerModal({ state, value, onSelect, onPickForMe }) {
  const activeFilterCount = state.filterListIds.length + state.filterModuleCodes.length;
  const backdropClassName = !state.open ? styles.hidden : styles.taskPickBackdrop;
  const modalClassName = !state.open ? styles.hidden : styles.taskPickDropdown;

  return (
    <StandardModal onClose={() => state.setOpen(false)} size="md" hideHeader backdropClassName={backdropClassName} modalClassName={modalClassName} contentClassName={styles.taskPickContent}>
      {state.open && <div onMouseDown={(event) => closeFilterPanel(event, state)}><ModalHeader setOpen={state.setOpen} /><Toolbar state={state} activeFilterCount={activeFilterCount} onPickForMe={onPickForMe} /><TaskResults state={state} value={value} onSelect={onSelect} /></div>}
    </StandardModal>
  );
}

function closeFilterPanel(event, state) {
  if (state.isFilterOpen && state.filterWrapRef.current && !state.filterWrapRef.current.contains(event.target)) state.setIsFilterOpen(false);
}
