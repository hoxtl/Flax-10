/**
 * Hook that filters a task list by active list, smart filter, and date range.
 */

import { useMemo } from "react";

function buildDateBounds() {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd  = new Date(todayEnd); weekEnd.setDate(weekEnd.getDate() + 7);
  return { dayStart, todayEnd, weekEnd };
}

function applyListFilter(tasks, activeListId, filterListIds) {
  if (filterListIds && filterListIds.length > 0) {
    const set = new Set(filterListIds.map(String));
    return tasks.filter(t => set.has(String(t.task_list)));
  }
  if (activeListId) {
    return tasks.filter(t => String(t.task_list) === String(activeListId));
  }
  return tasks;
}

function applySmartFilter(filtered, activeFilter, bounds) {
  const { dayStart, todayEnd, weekEnd } = bounds;
  if (activeFilter === "overdue")
    return filtered.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date());
  if (activeFilter === "today")
    return filtered.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd);
  if (activeFilter === "this_week")
    return filtered.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= weekEnd);
  if (activeFilter === "later")
    return filtered.filter(t => t.due_date && new Date(t.due_date) > weekEnd);
  return filtered;
}

/**
 * Returns a filtered subset of tasks based on the active list and date filter.
 *
 * @param {object[]} tasks
 * @param {string|null} activeListId
 * @param {string} activeFilter
 * @param {string[]} filterListIds
 * @returns {object[]}
 */
export default function useFilteredTasks(tasks, activeListId, activeFilter, filterListIds = []) {
  return useMemo(() => {
    const bounds   = buildDateBounds();
    const byList   = applyListFilter(tasks, activeListId, filterListIds);
    return applySmartFilter(byList, activeFilter, bounds);
  }, [tasks, activeListId, activeFilter, filterListIds]);
}
