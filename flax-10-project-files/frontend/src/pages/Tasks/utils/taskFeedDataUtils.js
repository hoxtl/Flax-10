/*
 * Pure helpers for useTaskFeedData (date bounds, search filter, time buckets).
 * Keeps hook body under line limit.
 */

import { isRoutineOrEventTask } from "./taskFeedUtils";

export function buildDateBounds() {
  const now = new Date();
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(todayEnd); weekEnd.setDate(weekEnd.getDate() + 7);
  return { now, dayStart, todayEnd, weekEnd };
}

export function matchesSearch(task, q, listMap) {
  const listName = listMap[String(task.task_list)]?.name || "";
  return (
    task.title.toLowerCase().includes(q) ||
    (task.description || "").toLowerCase().includes(q) ||
    (task.module_code || "").toLowerCase().includes(q) ||
    (task.module_name || "").toLowerCase().includes(q) ||
    listName.toLowerCase().includes(q)
  );
}

export function filterBySearch(tasks, search, listMap) {
  if (!search.trim()) return tasks;
  const q = search.toLowerCase();
  return tasks.filter((t) => matchesSearch(t, q, listMap));
}

export function getOverdue(filtered, now) {
  return filtered.filter((t) => t.due_date && new Date(t.due_date) < now && !t.completed && !isRoutineOrEventTask(t));
}

export function getToday(filtered, now, todayEnd) {
  return filtered.filter((t) => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
}

export function getThisWeek(filtered, todayEnd, weekEnd) {
  return filtered.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d > todayEnd && d <= weekEnd;
  });
}

export function getLater(filtered, weekEnd) {
  return filtered.filter((t) => !t.due_date || new Date(t.due_date) > weekEnd);
}

export function getCompletedTodayCount(completed, dayStart, todayEnd) {
  return completed.filter((t) => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd).length;
}

export function getCompletedWeekCount(completed, todayEnd, weekEnd) {
  return completed.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d > todayEnd && d <= weekEnd;
  }).length;
}

export function getCompletedLaterCount(completed, weekEnd) {
  return completed.filter((t) => !t.due_date || new Date(t.due_date) > weekEnd).length;
}

export function getFilterHandlers(filterListIds, onFilterByList, setFilterModuleCodes, setFilterQuery) {
  return {
    toggleListFilter: (value) => {
      const v = String(value);
      const curr = new Set((filterListIds || []).map(String));
      curr.has(v) ? curr.delete(v) : curr.add(v);
      onFilterByList?.(Array.from(curr));
    },
    toggleModuleFilter: (value) => {
      const v = String(value);
      setFilterModuleCodes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    },
    clearAllFilters: () => {
      onFilterByList?.([]);
      setFilterModuleCodes([]);
      setFilterQuery("");
    },
  };
}
