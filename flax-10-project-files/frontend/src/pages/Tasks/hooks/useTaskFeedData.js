/**
 * Hook that derives task feed data. Composes sub-hooks and utils.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getModules } from "../../../api/moduleApi";
import { getHeaderTitle } from "../utils/taskFeedUtils";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";
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

function normalizeModuleCode(value) {
  return String(value || "").trim().toUpperCase();
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
  const listItems = useMemo(() => (lists || []).map((l) => ({ value: String(l.id), label: l.name || "List" })), [lists]);
  const moduleItems = useMemo(() => {
    const byCode = new Map();
    (tasks || []).forEach((t) => {
      const code = normalizeModuleCode(t.module_code);
      if (!code) return;
      const name = String(t.module_name || moduleNameMap[code] || "").trim();
      if (!byCode.has(code)) byCode.set(code, name);
      else if (!byCode.get(code) && name) byCode.set(code, name);
    });
    return Array.from(byCode.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, name]) => ({
        value: code,
        label: name ? `${code} — ${name}` : code,
      }));
  }, [tasks, moduleNameMap]);
  const visibleListItems = useMemo(() => { const q = filterQuery.trim().toLowerCase(); return !q ? listItems : listItems.filter((o) => o.label.toLowerCase().includes(q)); }, [listItems, filterQuery]);
  const moduleCodePrefix = (code = "") => code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "Other";
  const groupedVisibleModuleItems = useMemo(() => { const q = filterQuery.trim().toLowerCase(); const base = !q ? moduleItems : moduleItems.filter((o) => o.label.toLowerCase().includes(q)); return base.reduce((acc, item) => { const k = moduleCodePrefix(item.value); if (!acc[k]) acc[k] = []; acc[k].push(item); return acc; }, {}); }, [moduleItems, filterQuery]);
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

function useTaskFeedEffects(searchInputRef, filterRef, isFilterOpen, setIsFilterOpen) {
  useEffect(() => {
    const handler = (e) => { const tag = e.target?.tagName; const isEditing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.contentEditable === "true"; if (e.key === "/" && !isEditing) { e.preventDefault(); searchInputRef.current?.focus(); } if (e.key === "n" && !isEditing) { e.preventDefault(); document.querySelector('input[aria-label="Task name"]')?.focus(); } if (e.key === "Escape" && isEditing) e.target.blur(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchInputRef]);
  useEffect(() => { if (!isFilterOpen) return; const onDown = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false); }; document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [isFilterOpen, filterRef, setIsFilterOpen]);
}

function useTaskFeedModuleNameMap() {
  const [moduleNameMap, setModuleNameMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    getModules()
      .then((modules) => {
        if (cancelled) return;
        const next = {};
        (modules || []).forEach((m) => {
          const code = normalizeModuleCode(m?.module_code);
          const name = String(m?.module_name || m?.title || "").trim();
          if (code && name) next[code] = name;
        });
        setModuleNameMap(next);
      })
      .catch(() => { if (!cancelled) setModuleNameMap({}); });
    return () => { cancelled = true; };
  }, []);
  return moduleNameMap;
}

/** Derives task feed state and section data from tasks, lists, and filter options. */
export default function useTaskFeedData(opts) {
  const { tasks, lists, activeFilter, activeListId, activeModuleCode = null, filterListIds = [], onFilterByList, onPlanTomorrow } = opts;
  const navigate = useNavigate();
  const filterState = useTaskFeedFilterState(filterListIds, onFilterByList);
  const moduleNameMap = useTaskFeedModuleNameMap();
  const filterOptions = useTaskFeedFilterOptions(tasks, lists, filterState.filterQuery, moduleNameMap);
  const listMap = useTaskFeedListMap(lists);
  const tasksByModule = useMemo(() => { if (!filterState.filterModuleCodes?.length) return tasks; const set = new Set(filterState.filterModuleCodes.map(String)); return tasks.filter((t) => set.has(String(t.module_code || ""))); }, [tasks, filterState.filterModuleCodes]);
  const pending = tasksByModule.filter((t) => !t.completed);
  const completed = tasksByModule.filter((t) => t.completed);
  const filtered = useMemo(() => filterBySearch(pending, filterState.search, listMap), [pending, filterState.search, listMap]);
  const filteredCompleted = useMemo(() => filterBySearch(completed, filterState.search, listMap), [completed, filterState.search, listMap]);
  const buckets = useTaskFeedBuckets(filtered, filteredCompleted, filterState.search);
  const todayEmptyMessage = useMemo(() => getClearMessage(), []);
  const todayEmptyCardProps = useMemo(() => ({ message: todayEmptyMessage, sub: buckets.completedTodayCount > 0 ? `${buckets.completedTodayCount} task${buckets.completedTodayCount !== 1 ? "s" : ""} completed today. Take a moment — you earned it.` : "No tasks due today.", ctaLabel: "Plan tomorrow →", onCtaClick: () => { if (typeof onPlanTomorrow === "function") onPlanTomorrow(); else navigate("/tasks?open=fullPlanning"); } }), [buckets.completedTodayCount, todayEmptyMessage, onPlanTomorrow, navigate]);
  const activeList = useMemo(() => (activeListId && lists?.length ? lists.find((l) => String(l.id) === String(activeListId)) || null : null), [activeListId, lists]);
  const headerTitle = getHeaderTitle(activeFilter, activeList, activeModuleCode);
  const sectionProps = useMemo(() => ({ sortBy: filterState.sortBy, listMap, lists, hideListBadge: !!activeListId, searchQuery: filterState.search }), [filterState.sortBy, listMap, lists, activeListId, filterState.search]);
  useTaskFeedEffects(filterState.searchInputRef, filterState.filterRef, filterState.isFilterOpen, filterState.setIsFilterOpen);
  return { ...filterState, ...filterOptions, listMap, pending, completed, filtered, filteredCompleted, ...buckets, sectionProps, todayEmptyCardProps, headerTitle, showDone: true, setShowDone: () => {}, filterListIds, filterModuleCodes: filterState.filterModuleCodes, showSearchEmptyState: buckets.showSearchEmptyState };
}
