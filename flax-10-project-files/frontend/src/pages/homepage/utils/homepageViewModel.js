/*
 * Homepage view-model helpers.
 */

import { isToday, overlapsDay } from "../../../components/calendar/utils/dateUtils";
import { getAllFreeWindowsToday, getNavigatorContext, isNow, isRoutineOrEventTask } from "./index";

const MEAL_TITLES = ["breakfast", "lunch", "dinner"];
const SYSTEM_EVENT_SOURCES = ["module_deadline", "module_enrollment"];

function getTaskModuleId(task) {
  return task.module_id ?? task.module ?? task.moduleId ?? null;
}

function getTaskModuleKey(item) {
  return String(getTaskModuleId(item) ?? item?.module_code ?? "").trim().toUpperCase();
}

export function getEnrolledModules(modulesList, enrollments, isEnrolledIn) {
  return (modulesList || []).filter((module) => isEnrolledIn(module.id, enrollments));
}

export function getTomorrowFirstEvent(allCalEvents, selectedDate) {
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (allCalEvents || [])
    .filter((event) => event.start_time && overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), tomorrow))
    .sort((left, right) => new Date(left.start_time) - new Date(right.start_time))[0] ?? null;
}

export function getTaskCategoryPillMeta(task, taskLists, enrolledModules, getTag) {
  const listId = task.task_list != null ? String(task.task_list) : null;
  const directName = task.list_name || null;
  if (directName && directName.toLowerCase() !== 'none') return { label: String(directName).trim().slice(0, 20), listId };
  const list = (taskLists || []).find((item) => String(item.id) === listId);
  if (list?.name && list.name.toLowerCase() !== 'none') return { label: String(list.name).trim().slice(0, 20), listId };
  const moduleId = getTaskModuleId(task);
  const module = (enrolledModules || []).find((item) => String(item.id) === String(moduleId));
  if (module) return { label: (module.module_code || module.module_name || `M${module.id}`).toString().trim().slice(0, 8), listId: null };
  if (task.module_code) return { label: String(task.module_code).trim().slice(0, 8), listId: null };
  const tag = getTag?.(task.tag);
  return tag?.label ? { label: String(tag.label).trim().slice(0, 8), listId: null } : null;
}

export function getTaskCategoryColor(task, getTag) {
  const tag = getTag?.(task.tag);
  const label = (tag?.label || "").toString().toLowerCase();
  if (label.includes("academic")) return "sage";
  if (label.includes("personal")) return "flax";
  return getTaskModuleId(task) || task.module_code ? "sage" : "flax";
}

export function getSortedEvents(dayEvents) {
  const seen = new Set();
  return [...(dayEvents || [])]
    .filter((event) => {
      const title = (event.title || "").trim().toLowerCase();
      const dayKey = event.start_time ? new Date(event.start_time).toISOString().slice(0, 10) : null;
      const mealKey = dayKey ? `${dayKey}:${title}` : null;
      if (!MEAL_TITLES.includes(title) || !mealKey || !seen.has(mealKey)) return mealKey ? (seen.add(mealKey), true) : true;
      return false;
    })
    .sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
}

export function getPastItems(sortedEvents, now) {
  return (sortedEvents || []).filter((item) => {
    const end = item.end_time || item.start_time;
    return end && new Date(end) < now && !isNow(item.start_time, item.end_time);
  });
}

export function getUpcomingItems(sortedEvents, pastItems) {
  const pastIds = new Set((pastItems || []).map((item) => item.id));
  return (sortedEvents || []).filter((item) => !pastIds.has(item.id));
}

export function getPastIdsShownInTimeline(pastItems, upcomingItems) {
  return new Set((pastItems || []).filter((past) => {
    const pastEnd = new Date(past.end_time || past.start_time);
    return (upcomingItems || []).some((item) => pastEnd > new Date(item.start_time) && new Date(past.start_time) < new Date(item.end_time || item.start_time));
  }).map((item) => item.id));
}

export function getMissedItems(selectedDate, pastItems, pastIdsShownInTimeline) {
  if (!isToday(selectedDate)) return [];
  return (pastItems || []).filter((item) => !pastIdsShownInTimeline.has(item.id) && !SYSTEM_EVENT_SOURCES.includes(String(item.source)));
}

export function getSuggestableTasks(dayTasks, upcomingItems) {
  const scheduledTitles = new Set((upcomingItems || []).map((item) => item.title?.toLowerCase()));
  return (dayTasks || []).filter((task) => !scheduledTitles.has(task.title?.toLowerCase()));
}

export function getTasksDueToday(allTasks, now) {
  const todayStart = new Date(now);
  const todayEnd = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);
  const isOverdue = (task) => !task.completed && task.due_date && new Date(task.due_date) < todayStart;
  return (allTasks || []).filter((task) => {
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    return dueDate && dueDate >= todayStart && dueDate <= todayEnd;
  }).sort((left, right) => Number(isOverdue(right)) - Number(isOverdue(left)));
}

export function getDeadlineSuggestions(selectedDate, upcomingDeadlines, sortedEvents, nowMs) {
  if (!isToday(selectedDate)) return [];
  return (upcomingDeadlines || []).filter((deadline) => {
    const dueMs = deadline.start_due_date ? new Date(deadline.start_due_date).getTime() : 0;
    return dueMs > nowMs && dueMs <= nowMs + 14 * 24 * 60 * 60 * 1000 && !hasScheduledDeadlineMatch(deadline, sortedEvents);
  }).sort((left, right) => new Date(left.start_due_date) - new Date(right.start_due_date));
}

function hasScheduledDeadlineMatch(deadline, sortedEvents) {
  const titles = (sortedEvents || []).map((item) => (item.title || "").toLowerCase());
  const title = (deadline.assessment_title || deadline.title || "").toLowerCase();
  const code = (deadline.module_code || "").toLowerCase();
  return titles.some((item) => (title && item.includes(title.slice(0, 8))) || (code && item.includes(code)));
}

export function getOverdueTasksForNow(tasksDueToday, getTag, now) {
  return (tasksDueToday || []).filter((task) => !isRoutineOrEventTask(task, getTag) && !task.completed && task.due_date && new Date(task.due_date) < now)
    .sort((left, right) => new Date(left.due_date) - new Date(right.due_date));
}

export function getTaskWidgetList(allTasks, now) {
  const todayStart = new Date(now);
  const todayEnd = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);
  const tasks = (allTasks || []).filter((task) => isDueToday(task, todayStart, todayEnd)).map((task) => buildTaskWidgetItem(task, todayEnd));
  const nextTask = tasks.filter((task) => !task.completed).sort((left, right) => left.sortTime - right.sortTime).find((task) => leftAfterNow(task, now));
  if (nextTask) nextTask.taskWidgetStatus = "now";
  const sortedTasks = [...tasks].sort(compareTaskWidgetItems);
  const topPriorityTask = sortedTasks.find((task) => !task.completed);
  if (topPriorityTask) topPriorityTask.taskWidgetUrgentGlow = true;
  return sortedTasks;
}

const TASK_WIDGET_MIN_INCOMPLETE = 5;

export function getTaskWidgetDisplayList(allTasks, now, taskWidgetItemsOnly = []) {
  const displayList = [...(taskWidgetItemsOnly || [])];
  const incompleteCount = displayList.filter((task) => !task.completed).length;
  if (incompleteCount >= TASK_WIDGET_MIN_INCOMPLETE) return displayList;
  const todayStart = new Date(now);
  const todayEnd = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);
  const excludedIds = new Set(displayList.map((task) => String(task.id)));
  const fillers = buildTaskWidgetFillers(allTasks, todayStart, todayEnd)
    .filter((task) => !excludedIds.has(String(task.id)))
    .map((task) => buildTaskWidgetItem(task, todayEnd))
    .slice(0, TASK_WIDGET_MIN_INCOMPLETE - incompleteCount);
  return [...displayList, ...fillers].sort(compareTaskWidgetItems);
}

function isFillerCandidate(task, todayStart, todayEnd) {
  if (!task?.due_date || task.completed) return false;
  const dueDate = new Date(task.due_date);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate < todayStart || dueDate > todayEnd;
}

function classifyFillerTask(task, acc, todayStart) {
  const dueDate = new Date(task.due_date);
  if (dueDate < todayStart) acc.overdue.push(task);
  else acc.upcoming.push(task);
  return acc;
}

function buildTaskWidgetFillers(allTasks, todayStart, todayEnd) {
  const candidates = (allTasks || []).filter((task) => isFillerCandidate(task, todayStart, todayEnd));
  const { overdue, upcoming } = candidates.reduce((acc, task) => classifyFillerTask(task, acc, todayStart), { overdue: [], upcoming: [] });
  overdue.sort(compareRawTasksByDueDate);
  upcoming.sort(compareRawTasksByDueDate);
  return [...overdue, ...upcoming];
}

function compareRawTasksByDueDate(left, right) {
  const leftTime = new Date(left.due_date).getTime();
  const rightTime = new Date(right.due_date).getTime();
  if (leftTime !== rightTime) return leftTime - rightTime;
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function leftAfterNow(task, now) {
  return task.sortTime >= now;
}

function isDueToday(task, todayStart, todayEnd) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  return dueDate && dueDate >= todayStart && dueDate <= todayEnd;
}

function buildTaskWidgetItem(task, todayEnd) {
  const dueDate = new Date(task.due_date);
  const todayStart = new Date(todayEnd);
  todayStart.setHours(0, 0, 0, 0);
  return {
    type: "task",
    id: `task-${task.id}`,
    sortTime: dueDate,
    endTime: new Date(dueDate.getTime() + (task.estimated_blocks || 1) * 25 * 60000),
    taskWidgetStatus: task.completed ? "completed" : (dueDate < todayStart ? "overdue" : "upcoming"),
    ...task,
    priority: normalizeTaskWidgetPriority(task.priority),
  };
}

function compareOverdueItems(left, right) {
  if (getTaskOverdueRank(left) <= 0 || getTaskOverdueRank(right) <= 0) return 0;
  return getTaskTimeValue(left.sortTime) - getTaskTimeValue(right.sortTime);
}

function compareTaskWidgetItems(left, right) {
  if (Boolean(left.completed) !== Boolean(right.completed)) return Number(left.completed) - Number(right.completed);
  const overdueRankDiff = getTaskOverdueRank(right) - getTaskOverdueRank(left);
  if (overdueRankDiff) return overdueRankDiff;
  const overdueDiff = compareOverdueItems(left, right);
  if (overdueDiff) return overdueDiff;
  const dueDiff = getTaskTimeValue(left.sortTime) - getTaskTimeValue(right.sortTime);
  if (dueDiff) return dueDiff;
  const priorityDiff = getTaskPriorityRank(left.priority) - getTaskPriorityRank(right.priority);
  if (priorityDiff) return priorityDiff;
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function getTaskOverdueRank(task) {
  return String(task?.taskWidgetStatus || '').toLowerCase() === 'overdue' ? 1 : 0;
}

function getTaskPriorityRank(priority) {
  const order = {
    urgent: 0,
    medium: 1,
    high: 2,
  };
  return order[normalizeTaskWidgetPriority(priority)];
}

function getTaskTimeValue(dateLike) {
  const value = new Date(dateLike).getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function normalizeTaskWidgetPriority(priority) {
  const key = String(priority || "").toLowerCase();
  if (key === "urgent" || key === "high" || key === "medium") return key;
  return "medium";
}

export function getTaskWidgetDueTodayCount(taskWidgetItemsOnly, now) {
  const todayStart = new Date(now);
  const todayEnd = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);
  return (taskWidgetItemsOnly || []).filter((task) => {
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    return !task.completed && dueDate && dueDate >= todayStart && dueDate <= todayEnd;
  }).length;
}

export function getTaskWidgetCompletedCount(taskWidgetItemsOnly) {
  return (taskWidgetItemsOnly || []).filter((item) => item.completed).length;
}

export function getTaskWidgetSpineCompletedPct(taskWidgetItemsOnly, completedCount) {
  return taskWidgetItemsOnly.length > 0 ? (completedCount / taskWidgetItemsOnly.length) * 100 : 0;
}

export function getTodayFreeWindows(selectedDate, sortedEvents) {
  if (!isToday(selectedDate)) return [];
  return getAllFreeWindowsToday(sortedEvents, selectedDate).filter((window) => window.minutes >= 20).sort((left, right) => left.start - right.start);
}

export function getFreeWindowLabel(todayFreeWindows) {
  const nextWindow = todayFreeWindows?.[0];
  if (!nextWindow?.minutes) return null;
  if (nextWindow.minutes < 60) return `${nextWindow.minutes}m`;
  return nextWindow.minutes % 60 ? `${Math.floor(nextWindow.minutes / 60)}h ${nextWindow.minutes % 60}m` : `${Math.floor(nextWindow.minutes / 60)}h`;
}

export function getHomepageRecommendation(taskWidgetItemsOnly, upcomingDeadlines, freeWindowLabel) {
  const pendingTasks = (taskWidgetItemsOnly || []).filter((task) => !task.completed);
  const sortedDeadlines = [...(upcomingDeadlines || [])].filter((deadline) => deadline?.start_due_date).sort((left, right) => new Date(left.start_due_date) - new Date(right.start_due_date));
  const matchedRecommendation = getDeadlineTaskRecommendation(sortedDeadlines, pendingTasks);
  if (matchedRecommendation) return matchedRecommendation;
  return pendingTasks[0] && freeWindowLabel ? buildWindowRecommendation(pendingTasks[0], freeWindowLabel) : null;
}

function getDeadlineTaskRecommendation(sortedDeadlines, pendingTasks) {
  return sortedDeadlines.reduce((match, deadline) => match || buildDeadlineTaskRecommendation(deadline, pendingTasks), null);
}

function buildDeadlineTaskRecommendation(deadline, pendingTasks) {
  const task = pendingTasks.find((item) => getTaskModuleKey(item) === getTaskModuleKey(deadline));
  return task ? { text: `Focus on ${task.title} for ${deadline.assessment_title || deadline.title || deadline.module_code || "upcoming deadline"}.`, meta: buildRelativeDueMeta(deadline), taskTitle: task.title } : null;
}

function buildRelativeDueMeta(deadline) {
  const diffDays = Math.floor((new Date(deadline.start_due_date).getTime() - Date.now()) / 86400000);
  const dueLabel = diffDays <= 0 ? "due today" : diffDays === 1 ? "due tomorrow" : `due in ${diffDays}d`;
  return `${deadline.module_code || "Module"} · ${dueLabel}`;
}

function buildWindowRecommendation(task, freeWindowLabel) {
  return {
    text: `Use the ${freeWindowLabel} window to move ${task.title} forward.`,
    meta: "Best task to move next",
    taskTitle: task.title,
  };
}

export function getNavigatorData(now, selectedDate, sortedEvents) {
  return getNavigatorContext(now, selectedDate, sortedEvents, isToday);
}
