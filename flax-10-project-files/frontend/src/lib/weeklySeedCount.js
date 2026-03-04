/**
 * Shared 7-day seed/task count for Home & Analytics bridge.
 * Returns [Mon, Tue, Wed, Thu, Fri, Sat, Sun] counts of completed (non-routine) tasks.
 * @param {Array} tasks - List of tasks with completed, completed_at/completedAt, due_date
 * @param {(task) => boolean} isRoutineTask - Predicate to exclude routine/event tasks from count
 * @returns {number[]} - Length-7 array of counts for the current week (Monday = index 0)
 */
export function getSeedsPerDayThisWeek(tasks, isRoutineTask) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const counts = [0, 0, 0, 0, 0, 0, 0];

  (tasks || []).forEach((t) => {
    if (!t.completed || (typeof isRoutineTask === "function" && isRoutineTask(t))) return;
    const completedAt = t.completed_at ?? t.completedAt;
    const d = completedAt ? new Date(completedAt) : (t.due_date ? new Date(t.due_date) : null);
    if (!d) return;
    d.setHours(0, 0, 0, 0);
    const diffMs = d - monday;
    const dayIndex = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex] += 1;
  });

  return counts;
}
