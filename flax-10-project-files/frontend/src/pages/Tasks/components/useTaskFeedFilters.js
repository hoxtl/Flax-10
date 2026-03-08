/**
 * Custom hook that manages filter state, derived task sets, and filter
 * options for the TaskFeed. Keeps filter logic out of the render component.
 */

import { useState, useMemo } from "react";

/**
 * Manages list/module filter state plus all derived task collections.
 * @param {object[]} tasks          - All tasks (pending + completed)
 * @param {object[]} lists          - All task lists
 * @param {string[]} filterListIds  - Controlled list-filter IDs from parent
 * @param {Function} onFilterByList - Callback to update list filters in parent
 */
export function useTaskFeedFilters(tasks, lists, filterListIds, onFilterByList) {
  const [filterModuleCodes, setFilterModuleCodes] = useState([]);
  const [filterQuery, setFilterQuery]             = useState("");
  const [activeFilterTab, setActiveFilterTab]     = useState("lists");

  const listMap   = useMemo(() => buildListMap(lists), [lists]);
  const byModule  = useMemo(() => applyModuleFilter(tasks, filterModuleCodes), [tasks, filterModuleCodes]);
  const pending   = useMemo(() => byModule.filter(t => !t.completed), [byModule]);
  const completed = useMemo(() => byModule.filter(t =>  t.completed), [byModule]);

  const listItems   = useMemo(() => buildListItems(lists), [lists]);
  const moduleItems = useMemo(() => buildModuleItems(tasks), [tasks]);

  const visibleListItems          = useMemo(() => filterByQuery(listItems, filterQuery), [listItems, filterQuery]);
  const groupedVisibleModuleItems = useMemo(() => groupModuleItems(moduleItems, filterQuery), [moduleItems, filterQuery]);
  const moduleGroupKeys           = useMemo(() => Object.keys(groupedVisibleModuleItems).sort(), [groupedVisibleModuleItems]);
  const activeFilterCount         = (filterListIds?.length || 0) + filterModuleCodes.length;

  return {
    listMap, pending, completed,
    visibleListItems, groupedVisibleModuleItems, moduleGroupKeys,
    filterModuleCodes, filterQuery, setFilterQuery,
    activeFilterTab, setActiveFilterTab, activeFilterCount,
    toggleListFilter:   (v) => onFilterByList?.(toggleSet(filterListIds, v)),
    toggleModuleFilter: (v) => setFilterModuleCodes(prev => toggleArray(prev, String(v))),
    clearAllFilters:    ()  => { onFilterByList?.([]); setFilterModuleCodes([]); setFilterQuery(""); },
  };
}

function buildListMap(lists) {
  const map = {};
  (lists || []).forEach((l, idx) => { map[String(l.id)] = { ...l, idx }; });
  return map;
}

function applyModuleFilter(tasks, codes) {
  if (!codes.length) return tasks;
  const selected = new Set(codes.map(String));
  return tasks.filter(t => selected.has(String(t.module_code || "")));
}

function buildListItems(lists) {
  return (lists || []).map(l => ({ value: String(l.id), label: l.name || "List" }));
}

function buildModuleItems(tasks) {
  const byCode = new Map();
  (tasks || []).forEach((t) => {
    const code = String(t.module_code || "").trim();
    if (!code) return;
    const name = String(t.module_name || "").trim();
    if (!byCode.has(code)) byCode.set(code, name);
    else if (!byCode.get(code) && name) byCode.set(code, name);
  });
  return Array.from(byCode.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, name]) => ({ value: code, label: name ? `${code} — ${name}` : code }));
}

function filterByQuery(items, query) {
  const q = query.trim().toLowerCase();
  return q ? items.filter(o => o.label.toLowerCase().includes(q)) : items;
}

function moduleCodePrefix(code) {
  return code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "Other";
}

function addToModuleGroup(acc, item) {
  const k = moduleCodePrefix(item.value);
  if (!acc[k]) acc[k] = [];
  acc[k].push(item);
  return acc;
}

function groupModuleItems(items, filterQuery) {
  return filterByQuery(items, filterQuery).reduce(addToModuleGroup, {});
}

function toggleSet(ids, value) {
  const curr = new Set((ids || []).map(String));
  const v = String(value);
  if (curr.has(v)) curr.delete(v); else curr.add(v);
  return Array.from(curr);
}

function toggleArray(arr, value) {
  return arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
}
