/*
 * Derive task feed search, filter, grouping, and empty-state data.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getModules } from "../../../api/modules/moduleApi";
import { normalizeModuleCode } from "../../../utils/moduleCodeUtils";
import { buildListItems, groupModuleItems, filterListItems } from "../../../components/Timer/taskInput/taskInputUtils";
import { getHeaderTitle } from "../utils/taskFeedUtils";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
import { isReadingList, getReadingListLabel } from "../utils/readingListUtils";
import {
  buildDateBounds,
  filterBySearch,
  getOverdue,
  getToday,
  getThisWeek,
  getLater,
  getCompletedTodayCount,
  getCompletedWeekCount,
  getCompletedLaterCount,
  getFilterHandlers,
} from "../utils/taskFeedDataUtils";

function buildModuleItems(tasks, moduleNameMap) {
  const byCode = new Map();
  (tasks || []).forEach((task) => {
    const code = normalizeModuleCode(task.module_code);
    if (!code) return;
    const name = String(task.module_name || moduleNameMap[code] || "").trim();
    if (!byCode.has(code) || (!byCode.get(code) && name)) byCode.set(code, name);
  });
  return Array.from(byCode.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => ({ value: code, label: name ? `${code} — ${name}` : code }));
}

function useTaskFeedFilterState(filterListIds, onFilterByList) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [filterModuleCodes, setFilterModuleCodes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("lists");
  const [filterQuery, setFilterQuery] = useState("");
  const searchInputRef = useRef(null);
  const filterRef = useRef(null);
  const handlers = useMemo(
    () => getFilterHandlers(filterListIds, onFilterByList, setFilterModuleCodes, setFilterQuery),
    [filterListIds, onFilterByList]
  );
  const activeFilterCount = (filterListIds?.length || 0) + filterModuleCodes.length;
  return { search, setSearch, sortBy, setSortBy, filterModuleCodes, isFilterOpen, setIsFilterOpen, activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, searchInputRef, filterRef, ...handlers, activeFilterCount };
}

function useTaskFeedFilterOptions(tasks, lists, filterQuery, moduleNameMap) {
  const listItems = useMemo(() => buildListItems(lists), [lists]);
  const moduleItems = useMemo(() => buildModuleItems(tasks, moduleNameMap), [tasks, moduleNameMap]);
  const visibleListItems = useMemo(() => filterListItems(listItems, filterQuery), [listItems, filterQuery]);
  const groupedVisibleModuleItems = useMemo(() => groupModuleItems(moduleItems, filterQuery), [moduleItems, filterQuery]);
  const moduleGroupKeys = useMemo(() => Object.keys(groupedVisibleModuleItems).sort(), [groupedVisibleModuleItems]);
  return { visibleListItems, groupedVisibleModuleItems, moduleGroupKeys };
}

function useTaskFeedListMap(lists) {
  return useMemo(() => { const map = {}; (lists || []).forEach((l, idx) => { map[String(l.id)] = { ...l, idx }; }); return map; }, [lists]);
}

function useTaskFeedBuckets(filtered, filteredCompleted, search) {
  const bounds = useMemo(() => buildDateBounds(), []);
  const { now, dayStart, todayEnd, weekEnd } = bounds;
  const overdue = useMemo(() => getOverdue(filtered, now), [filtered, now]);
  const today = useMemo(() => getToday(filtered, now, todayEnd), [filtered, now, todayEnd]);
  const thisWeek = useMemo(() => getThisWeek(filtered, todayEnd, weekEnd), [filtered, todayEnd, weekEnd]);
  const later = useMemo(() => getLater(filtered, weekEnd), [filtered, weekEnd]);
  const completedTodayCount = useMemo(() => getCompletedTodayCount(filteredCompleted, dayStart, todayEnd), [filteredCompleted, dayStart, todayEnd]);
  const completedWeekCount = useMemo(() => getCompletedWeekCount(filteredCompleted, todayEnd, weekEnd), [filteredCompleted, todayEnd, weekEnd]);
  const completedLaterCount = useMemo(() => getCompletedLaterCount(filteredCompleted, weekEnd), [filteredCompleted, weekEnd]);
  const allTasksCombined = useMemo(() => [...overdue, ...today, ...thisWeek, ...later], [overdue, today, thisWeek, later]);
  const showSearchEmptyState = search.trim() && filtered.length === 0 && filteredCompleted.length === 0;
  return { overdue, today, thisWeek, later, completedTodayCount, completedWeekCount, completedLaterCount, allTasksCombined, showSearchEmptyState };
}

function useTaskFeedKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e) => { const tag = e.target?.tagName; const isEditing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.contentEditable === "true"; if (e.key === "n" && !isEditing) { e.preventDefault(); document.querySelector('input[aria-label="Task name"]')?.focus(); } if (e.key === "Escape" && isEditing) e.target.blur(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

function useFilterClickOutside(filterRef, isFilterOpen, setIsFilterOpen) {
  useEffect(() => { if (!isFilterOpen) return; const onDown = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false); }; document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [isFilterOpen, filterRef, setIsFilterOpen]);
}

function useTaskFeedEffects(filterRef, isFilterOpen, setIsFilterOpen) {
  useTaskFeedKeyboardShortcuts();
  useFilterClickOutside(filterRef, isFilterOpen, setIsFilterOpen);
}

function buildModuleNameMap(modules) {
  const map = {};
  (modules || []).forEach((m) => {
    const code = normalizeModuleCode(m?.module_code);
    const name = String(m?.module_name || m?.title || "").trim();
    if (code && name) map[code] = name;
  });
  return map;
}

function useTaskFeedModuleNameMap() {
  const [moduleNameMap, setModuleNameMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    getModules()
      .then((modules) => { if (!cancelled) setModuleNameMap(buildModuleNameMap(modules)); })
      .catch(() => { if (!cancelled) setModuleNameMap({}); });
    return () => { cancelled = true; };
  }, []);
  return moduleNameMap;
}

function useSearchSourceTasks(hasSearchQuery, activeFilter, allTasks, filterListIds, tasks) {
  return useMemo(() => {
    if (!hasSearchQuery) return tasks;
    if (activeFilter === "overdue") return allTasks.filter((task) => !task.completed && task.due_date && new Date(task.due_date) < new Date());
    if (!filterListIds?.length) return allTasks;
    const allowedListIds = new Set(filterListIds.map(String));
    return allTasks.filter((task) => allowedListIds.has(String(task.task_list)));
  }, [activeFilter, allTasks, filterListIds, hasSearchQuery, tasks]);
}

function useTaskFeedCollections(searchSourceTasks, filterModuleCodes) {
  return useMemo(() => {
    if (!filterModuleCodes?.length) return { pending: searchSourceTasks.filter((task) => !task.completed), completed: searchSourceTasks.filter((task) => task.completed) };
    const selectedCodes = new Set(filterModuleCodes.map(String));
    const filteredTasks = searchSourceTasks.filter((task) => selectedCodes.has(String(task.module_code || "")));
    return { pending: filteredTasks.filter((task) => !task.completed), completed: filteredTasks.filter((task) => task.completed) };
  }, [filterModuleCodes, searchSourceTasks]);
}

function useActiveTaskList(activeListId, lists) {
  return useMemo(() => (activeListId && lists?.length ? lists.find((list) => String(list.id) === String(activeListId)) || null : null), [activeListId, lists]);
}

function buildTodayEmptyCardProps(clearMessage, completedTodayCount, navigate, onPlanTomorrow) {
  const sub = completedTodayCount > 0
    ? `${completedTodayCount} task${completedTodayCount !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`
    : "No tasks due today.";
  return {
    message: clearMessage,
    sub,
    ctaLabel: "Plan tomorrow →",
    onCtaClick: () => (typeof onPlanTomorrow === "function" ? onPlanTomorrow() : navigate("/tasks?open=fullPlanning")),
  };
}

function buildAllTasksEmptyCardProps(activeList, allTasksCombined, clearMessage, completedCount) {
  if (allTasksCombined.length > 0 || completedCount === 0) return null;
  if (isReadingList(activeList)) return { message: "All caught up on readings!", sub: `No suggested readings left for ${getReadingListLabel(activeList)} right now.` };
  return { message: clearMessage, sub: `${completedCount} task${completedCount !== 1 ? "s" : ""} completed. Take a moment — you earned it.` };
}

function buildSectionProps(sortBy, listMap, lists, activeListId, hasSearchQuery, search) {
  return { sortBy, listMap, lists, hideListBadge: !!activeListId && !hasSearchQuery, searchQuery: search };
}

function useTaskFeedFilteredResults({ activeFilter, allTasks, filterListIds, filterModuleCodes, hasSearchQuery, listMap, search, tasks }) {
  const searchSourceTasks = useSearchSourceTasks(hasSearchQuery, activeFilter, allTasks, filterListIds, tasks);
  const { pending, completed } = useTaskFeedCollections(searchSourceTasks, filterModuleCodes);
  const filtered = useMemo(() => filterBySearch(pending, search, listMap), [pending, search, listMap]);
  const filteredCompleted = useMemo(() => filterBySearch(completed, search, listMap), [completed, search, listMap]);
  return { pending, completed, filtered, filteredCompleted, ...useTaskFeedBuckets(filtered, filteredCompleted, search) };
}

function useTaskFeedPresentation({ activeFilter, activeListId, activeModuleCode, buckets, completedCount, filterState, hasSearchQuery, listMap, lists, onPlanTomorrow }) {
  const navigate = useNavigate();
  const clearMessage = useMemo(() => getClearMessage(), []);
  const activeList = useActiveTaskList(activeListId, lists);
  const todayEmptyCardProps = useMemo(() => buildTodayEmptyCardProps(clearMessage, buckets.completedTodayCount, navigate, onPlanTomorrow), [buckets.completedTodayCount, clearMessage, navigate, onPlanTomorrow]);
  const allTasksEmptyCardProps = useMemo(() => buildAllTasksEmptyCardProps(activeList, buckets.allTasksCombined, clearMessage, completedCount), [activeList, buckets.allTasksCombined, clearMessage, completedCount]);
  const headerTitle = getHeaderTitle(activeFilter, hasSearchQuery ? null : activeList, activeModuleCode);
  const sectionProps = useMemo(() => buildSectionProps(filterState.sortBy, listMap, lists, activeListId, hasSearchQuery, filterState.search), [activeListId, filterState.search, filterState.sortBy, hasSearchQuery, listMap, lists]);
  return { headerTitle, sectionProps, todayEmptyCardProps, allTasksEmptyCardProps };
}

/* Derive task feed state and section data from tasks, lists, and filter options. */
export default function useTaskFeedData(opts) {
  const { tasks, allTasks = tasks, lists, activeFilter, activeListId, activeModuleCode = null, filterListIds = [], onFilterByList, onPlanTomorrow } = opts;
  const filterState = useTaskFeedFilterState(filterListIds, onFilterByList);
  const hasSearchQuery = filterState.search.trim().length > 0;
  const moduleNameMap = useTaskFeedModuleNameMap();
  const filterOptions = useTaskFeedFilterOptions(tasks, lists, filterState.filterQuery, moduleNameMap);
  const listMap = useTaskFeedListMap(lists);
  const results = useTaskFeedFilteredResults({ activeFilter, allTasks, filterListIds, filterModuleCodes: filterState.filterModuleCodes, hasSearchQuery, listMap, search: filterState.search, tasks });
  const presentation = useTaskFeedPresentation({ activeFilter, activeListId, activeModuleCode, buckets: results, completedCount: results.completed.length, filterState, hasSearchQuery, listMap, lists, onPlanTomorrow });
  useTaskFeedEffects(filterState.filterRef, filterState.isFilterOpen, filterState.setIsFilterOpen);
  return { ...filterState, ...filterOptions, listMap, ...results, ...presentation, filterListIds, filterModuleCodes: filterState.filterModuleCodes };
}
