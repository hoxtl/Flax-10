/**
 * Helpers for the TaskFeed page: routine/event detection and header title.
 */

/** Returns true if the task is treated as a routine or event (excluded from overdue). */
export function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

/** Returns the feed header title from active filter and list state. */
export function getHeaderTitle(activeFilter, activeList, activeModuleCode) {
  if (activeFilter === "today") return "Today";
  if (activeFilter === "this_week") return "This Week";
  if (activeFilter === "later") return "Later";
  if (activeFilter === "overdue") return "Overdue";
  if (activeList) {
    return activeModuleCode ? `${activeList.name || "List"}: ${activeModuleCode}` : (activeList.name || "List");
  }
  return activeModuleCode || "All tasks";
}
