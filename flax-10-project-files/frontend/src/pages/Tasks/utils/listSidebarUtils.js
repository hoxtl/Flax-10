/**
 * Helpers for ListSidebar: task counts and smart filters.
 */

import { isRoutineOrEventTask } from "./taskFeedUtils";

function computeCounts(tasks, lists) {
  const now = new Date();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const overdueCount = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < now && !isRoutineOrEventTask(t)).length;
  const todayCount = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd).length;
  const thisWeekCount = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= weekEnd).length;
  const laterCount = tasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) > weekEnd).length;
  const allCount = tasks.filter((t) => !t.completed).length;
  const listCounts = lists.reduce((acc, l) => {
    acc[l.id] = tasks.filter((t) => !t.completed && String(t.task_list) === String(l.id)).length;
    return acc;
  }, {});
  return { overdueCount, todayCount, thisWeekCount, laterCount, allCount, listCounts };
}

function buildSmartFilters(overdueCount, todayCount, thisWeekCount, laterCount, allCount) {
  return [
    { id: "all", label: "All tasks", emoji: "📋", count: allCount },
    { id: "today", label: "Today", emoji: "📅", count: todayCount },
    { id: "this_week", label: "This Week", emoji: "🗓️", count: thisWeekCount },
    { id: "later", label: "Later", emoji: "⏳", count: laterCount },
    ...(overdueCount > 0 ? [{ id: "overdue", label: "Overdue", emoji: "⚠️", count: overdueCount, danger: true }] : []),
  ];
}

export function computeListSidebarCounts(tasks, lists) {
  const { overdueCount, todayCount, thisWeekCount, laterCount, allCount, listCounts } = computeCounts(tasks, lists);
  const smartFilters = buildSmartFilters(overdueCount, todayCount, thisWeekCount, laterCount, allCount);
  return { listCounts, smartFilters };
}
