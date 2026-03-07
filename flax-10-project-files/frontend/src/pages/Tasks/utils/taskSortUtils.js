/**
 * Task sorting utilities.
 * Each sort strategy is implemented as a dedicated comparator function
 * to keep each function focused and within line limits.
 */

/** Maps priority labels to a numeric sort order (lower = higher priority). */
export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function comparePriority(a, b) {
  const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
  if (pd !== 0) return pd;
  return new Date(a.due_date || 0) - new Date(b.due_date || 0);
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function compareDue(a, b) {
  if (!a.due_date && !b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return new Date(a.due_date) - new Date(b.due_date);
}

/**
 * @param {object} a
 * @param {object} b
 * @param {object} listMap - Map of list id to list object.
 * @returns {number}
 */
function compareList(a, b, listMap) {
  const la = listMap?.[String(a.task_list)]?.name || "";
  const lb = listMap?.[String(b.task_list)]?.name || "";
  if (la !== lb) return la.localeCompare(lb);
  return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function compareEstTime(a, b) {
  const diff = (a.estimated_blocks ?? 1) - (b.estimated_blocks ?? 1);
  if (diff !== 0) return diff;
  return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
}

/**
 * Returns a sorted copy of tasks using the specified sort strategy.
 *
 * @param {object[]} tasks
 * @param {string} sortBy - One of: priority, due, alpha, list, date_added, est_time.
 * @param {object} listMap - Map of list id to list object.
 * @returns {object[]}
 */
export function sortTasks(tasks, sortBy, listMap) {
  const comparators = {
    priority:   (a, b) => comparePriority(a, b),
    due:        (a, b) => compareDue(a, b),
    alpha:      (a, b) => a.title.localeCompare(b.title),
    list:       (a, b) => compareList(a, b, listMap),
    date_added: (a, b) => (b.id ?? 0) - (a.id ?? 0),
    est_time:   (a, b) => compareEstTime(a, b),
  };
  return [...tasks].sort(comparators[sortBy] || comparePriority);
}
