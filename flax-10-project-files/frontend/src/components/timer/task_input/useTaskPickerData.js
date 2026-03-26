/*
 * State and data loading for the task picker.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildListItems, buildModuleItems, filterListItems, filterTasks, getRecommendedTask, groupModuleItems, hydrateTasks, mapEnrolledModules, sortTasks } from './taskInputUtils';
import { SORT_URGENCY } from './taskInputConstants';

function useTaskPickerFlags() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState(SORT_URGENCY);
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(() => {
    try { return sessionStorage.getItem('timerTaskId'); } catch { return null; }
  });
  const [recommendedTaskId, setRecommendedTaskId] = useState(null);
  const [filterListIds, setFilterListIds] = useState([]);
  const [filterModuleCodes, setFilterModuleCodes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('lists');
  const [filterQuery, setFilterQuery] = useState('');
  return { open, setOpen, loading, setLoading, sortBy, setSortBy, search, setSearch, selectedTaskId, setSelectedTaskId, recommendedTaskId, setRecommendedTaskId, filterListIds, setFilterListIds, filterModuleCodes, setFilterModuleCodes, isFilterOpen, setIsFilterOpen, activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery };
}

function useTaskDataStore() {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [enrolledModules, setEnrolledModules] = useState([]);
  return { tasks, setTasks, lists, setLists, enrolledModules, setEnrolledModules };
}

function usePickerRefs() {
  const ref = useRef(null);
  const filterWrapRef = useRef(null);
  return { ref, filterWrapRef };
}

function useOutsideClose(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => closeWhenOutside(event, ref, setOpen);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, ref, setOpen]);
}

function closeWhenOutside(event, ref, setOpen) {
  if (ref.current && !ref.current.contains(event.target)) setOpen(false);
}

function useEnrolledModules(setEnrolledModules) {
  useEffect(() => {
    let active = true;
    import('../../../api/moduleApi').then(({ getModules, getEnrollments }) => Promise.all([getModules(), getEnrollments()]).then(([modules, enrollments]) => active && setEnrolledModules(mapEnrolledModules(modules, enrollments))).catch(() => {}));
    return () => { active = false; };
  }, [setEnrolledModules]);
}

async function fetchTaskPayload() {
  const taskService = await import('../../../api/taskApi');
  return Promise.all([taskService.fetchTasks(), taskService.fetchTaskLists()]);
}

function applyTaskPayload(payload, setTasks, setLists, sort) {
  const [tasksData, listsData] = payload;
  setLists(listsData || []);
  setTasks(sortTasks(hydrateTasks(tasksData, listsData), sort).slice(0, 100));
}

function useTaskLoader(state, store) {
  return useCallback((sort = state.sortBy) => loadTasks(sort, state.setLoading, store.setTasks, store.setLists), [state.sortBy, state.setLoading, store.setTasks, store.setLists]);
}

async function loadTasks(sort, setLoading, setTasks, setLists) {
  setLoading(true);
  try {
    applyTaskPayload(await fetchTaskPayload(), setTasks, setLists, sort);
  } catch {
    setTasks([]);
  } finally {
    setLoading(false);
  }
}

function useDerivedTaskPickerState(state, store) {
  const listItems = useMemo(() => buildListItems(store.lists), [store.lists]);
  const moduleItems = useMemo(() => buildModuleItems(store.enrolledModules, store.tasks), [store.enrolledModules, store.tasks]);
  const visibleListItems = useMemo(() => filterListItems(listItems, state.filterQuery), [listItems, state.filterQuery]);
  const groupedModuleItems = useMemo(() => groupModuleItems(moduleItems, state.filterQuery), [moduleItems, state.filterQuery]);
  const moduleGroupKeys = useMemo(() => Object.keys(groupedModuleItems).sort(), [groupedModuleItems]);
  const filteredTasks = useMemo(() => filterTasks(store.tasks, state), [store.tasks, state]);
  const recommendedTask = useMemo(() => getRecommendedTask(filteredTasks), [filteredTasks]);
  return { listItems, moduleItems, visibleListItems, groupedModuleItems, moduleGroupKeys, filteredTasks, recommendedTask };
}

export function useTaskPickerData() {
  const state = useTaskPickerFlags();
  const store = useTaskDataStore();
  const refs = usePickerRefs();
  const loadTasks = useTaskLoader(state, store);
  const derived = useDerivedTaskPickerState(state, store);

  useOutsideClose(state.open, state.setOpen, refs.ref);
  useEnrolledModules(store.setEnrolledModules);
  return { ...state, ...store, ...refs, ...derived, loadTasks };
}
