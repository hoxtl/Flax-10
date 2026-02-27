/**
 * Homepage task helpers. Pure functions only.
 */

/** Task duration in minutes: estimated_blocks (Pomodoro blocks) × 25. */
export function taskDurationMins(task) {
  return (task.estimated_blocks || 1) * 25;
}

/** Returns tasks that fit in gapMinutes. Prioritizes due within 48h, then urgency. */
export function getTasksThatFitGap(tasks, gapMinutes) {
  if (!tasks?.length || gapMinutes < 25) return { suggested: null, top3: [] };
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const fits = (t) => taskDurationMins(t) <= gapMinutes;
  const bySmartScheduler = (a, b) => {
    const aDue = a.due_date ? new Date(a.due_date) : null;
    const bDue = b.due_date ? new Date(b.due_date) : null;
    const aIn48 = aDue && aDue <= in48h;
    const bIn48 = bDue && bDue <= in48h;
    if (aIn48 && !bIn48) return -1;
    if (!aIn48 && bIn48) return 1;
    const aOverdue = aDue && aDue < now;
    const bOverdue = bDue && bDue < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aDue && bDue) return aDue - bDue;
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  };
  const filtered = tasks.filter(fits).sort(bySmartScheduler);
  return { suggested: filtered[0] || null, top3: filtered.slice(0, 3) };
}

/** Task is routine (meals/sleep) or event-like (lecture/seminar/tutorial). */
export function isRoutineOrEventTask(task, getTag) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tagLabel = (getTag && getTag(task.tag)?.label) || (task.tag_name || "").toString();
  const tagLower = tagLabel.toLowerCase();
  if (tagLower === "routine" || tagLower === "wellness" || tagLower === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack|commute/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

/** Seeds by category for Growth by Category: completed only, excluding routine. */
export function calculateSeedsByCategory(tasks, getTag) {
  const completed = (tasks || []).filter((t) => t.completed && !isRoutineOrEventTask(t, getTag));
  let academic = 0;
  let personal = 0;
  completed.forEach((t) => {
    const label = (getTag && getTag(t.tag)?.label) || (t.tag_name || "").toString();
    if (/academic|study|lecture|exam|coursework/i.test(label)) academic += 1;
    else personal += 1;
  });
  return { academic, personal };
}

/** True if task is routine/event and its due time has passed — treat as "done". */
export function isAutoPassedTask(task, now = new Date(), getTag) {
  if (!isRoutineOrEventTask(task, getTag) || !task.due_date) return false;
  return new Date(task.due_date) < now;
}
