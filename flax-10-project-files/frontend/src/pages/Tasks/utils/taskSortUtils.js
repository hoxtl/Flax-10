/*
 * Task sorting utilities.
 */

import {
  PRIORITY_ORDER,
  compareTaskPriority,
  compareTaskDue,
  compareTaskEstimatedTime,
} from "../../../lib/focusPlanner";

function compareList(a, b, listMap) {
  const la = listMap?.[String(a.task_list)]?.name || "";
  const lb = listMap?.[String(b.task_list)]?.name || "";
  if (la !== lb) return la.localeCompare(lb);
  return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
}

export function sortTasks(tasks, sortBy, listMap) {
  const comparators = {
    priority:   (a, b) => compareTaskPriority(a, b),
    due:        (a, b) => compareTaskDue(a, b),
    alpha:      (a, b) => a.title.localeCompare(b.title),
    "alpha-desc": (a, b) => b.title.localeCompare(a.title),
    list:       (a, b) => compareList(a, b, listMap),
    date_added: (a, b) => (b.id ?? 0) - (a.id ?? 0),
    date_added_asc: (a, b) => (a.id ?? 0) - (b.id ?? 0),
    est_time:   (a, b) => compareTaskEstimatedTime(a, b),
  };
  return [...tasks].sort(comparators[sortBy] || compareTaskPriority);
}
