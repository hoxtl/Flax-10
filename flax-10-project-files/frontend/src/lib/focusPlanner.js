/*
 * Task sorting and focus session planning utilities.
 */

export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export function getTaskDurationMinutes(task) {
  return (task?.estimated_blocks || 1) * 25;
}

function isValidSplit(total, perSession) {
  if (total % perSession !== 0) return false;
  const count = total / perSession;
  return count >= 1 && count <= 12;
}

function findSessionSplit(total) {
  const perSession = [1, 2, 3, 4].find((n) => isValidSplit(total, n));
  if (!perSession) return null;
  return { sessionCount: total / perSession, workMinutes: perSession * 25 };
}

export function splitEstimatedBlocks(blocks) {
  const total = Math.max(1, Number(blocks) || 1);
  return findSessionSplit(total) || { sessionCount: 1, workMinutes: total * 25 };
}

export function compareTaskPriority(a, b) {
  const delta = (PRIORITY_ORDER[a?.priority] ?? 4) - (PRIORITY_ORDER[b?.priority] ?? 4);
  if (delta !== 0) return delta;
  return new Date(a?.due_date || 0) - new Date(b?.due_date || 0);
}

export function compareTaskDue(a, b) {
  if (!a?.due_date && !b?.due_date) return 0;
  if (!a?.due_date) return 1;
  if (!b?.due_date) return -1;
  return new Date(a.due_date) - new Date(b.due_date);
}

export function compareTaskEstimatedTime(a, b) {
  const delta = (a?.estimated_blocks ?? 1) - (b?.estimated_blocks ?? 1);
  if (delta !== 0) return delta;
  return compareTaskPriority(a, b);
}

export function compareTaskUrgency(a, b, now = new Date()) {
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const aDue = a?.due_date ? new Date(a.due_date) : null;
  const bDue = b?.due_date ? new Date(b.due_date) : null;
  const aIn48h = aDue && aDue <= in48h;
  const bIn48h = bDue && bDue <= in48h;
  if (aIn48h && !bIn48h) return -1;
  if (!aIn48h && bIn48h) return 1;
  const aOverdue = aDue && aDue < now;
  const bOverdue = bDue && bDue < now;
  if (aOverdue && !bOverdue) return -1;
  if (!aOverdue && bOverdue) return 1;
  if (aDue && bDue) return aDue - bDue;
  return compareTaskPriority(a, b);
}

export function rankTasksForFocus(tasks, now = new Date()) {
  return [...(tasks || [])].sort((a, b) => compareTaskUrgency(a, b, now));
}

export function getTasksThatFitWindow(tasks, windowMinutes, now = new Date()) {
  if (!tasks?.length || windowMinutes < 25) return { suggested: null, top3: [] };
  const filtered = tasks
    .filter((task) => getTaskDurationMinutes(task) <= windowMinutes)
    .sort((a, b) => compareTaskUrgency(a, b, now));
  return { suggested: filtered[0] || null, top3: filtered.slice(0, 3) };
}
