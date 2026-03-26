/*
 * Display and formatting utilities for TaskCard components.
 */

import taskCardColors from './taskCardColors.json';

const MODULE_COLORS = taskCardColors;

export const PRIORITY_LABELS = { urgent: "Urgent", high: "High", medium: "Medium" };
export const PRIORITY_MARKS = { urgent: "❗❗❗", high: "❗❗", medium: "❗" };

export function getModuleColor(code) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  }
  return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
}

export function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const { diffDays, due } = getDueDayDiff(dueDate);
  if (diffDays < 0) return { label: "Overdue", status: "overdue" };
  if (diffDays === 0) return { label: "Today", status: "today" };
  if (diffDays === 1) return { label: "Tomorrow", status: "tomorrow" };
  if (diffDays <= 7) return { label: due.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), status: "future" };
  return { label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), status: "future" };
}

export function getCompletedDueLabel(dueDate) {
  if (!dueDate) return "Completed";
  const { diffDays, due } = getDueDayDiff(dueDate);
  if (diffDays === 0) return "Completed today";
  if (diffDays === -1) return "Completed yesterday";
  return `Completed ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function getDueDayDiff(dueDate) {
  const due = new Date(dueDate);
  const today = toCalendarDay(new Date());
  const dueDay = toCalendarDay(due);
  return { diffDays: Math.round((dueDay - today) / 86400000), due };
}

function toCalendarDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function splitEstimatedBlocks(blocks) {
  const total = Math.max(1, Number(blocks) || 1);
  const found = [1, 2, 3, 4]
    .map((perSession) => {
      if (total % perSession !== 0) return null;
      const sessions = total / perSession;
      if (sessions < 1 || sessions > 12) return null;
      return { sessionCount: sessions, workMinutes: perSession * 25 };
    })
    .find(Boolean);
  return found || { sessionCount: 1, workMinutes: total * 25 };
}

export function formatFocusBlocks(blocks) {
  const split = splitEstimatedBlocks(blocks);
  const unit = split.sessionCount === 1 ? "session" : "sessions";
  return `${split.sessionCount} ${unit} · ${split.sessionCount * split.workMinutes}m`;
}
