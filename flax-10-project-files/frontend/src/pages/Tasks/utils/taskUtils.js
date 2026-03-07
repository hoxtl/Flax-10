/**
 * Shared task utility functions for the Tasks module.
 */

/**
 * Returns true if the task is a routine or calendar event rather than a
 * user-created to-do item. Used to suppress completion animations and
 * overdue indicators for such tasks.
 *
 * @param {object|null} task
 * @returns {boolean}
 */
export function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}
