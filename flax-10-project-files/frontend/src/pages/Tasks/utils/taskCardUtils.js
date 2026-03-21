/*
 * Display and formatting utilities for TaskCard components.
 */

const MODULE_COLORS = [
  { text: "#5a4a3a", bg: "rgba(123,103,81,0.10)",  border: "rgba(123,103,81,0.24)"  },
  { text: "#615547", bg: "rgba(138,125,118,0.12)", border: "rgba(138,125,118,0.24)" },
  { text: "#6a5a45", bg: "rgba(150,127,98,0.11)",  border: "rgba(150,127,98,0.25)"  },
  { text: "#56515b", bg: "rgba(120,112,128,0.10)", border: "rgba(120,112,128,0.24)" },
  { text: "#4f5a63", bg: "rgba(106,121,133,0.10)", border: "rgba(106,121,133,0.24)" },
  { text: "#61584f", bg: "rgba(135,123,107,0.10)", border: "rgba(135,123,107,0.24)" },
  { text: "#5d544a", bg: "rgba(129,116,99,0.10)",  border: "rgba(129,116,99,0.24)"  },
  { text: "#564f47", bg: "rgba(118,107,95,0.10)",  border: "rgba(118,107,95,0.24)"  },
];

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
  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay - today) / 86400000);
  if (diffDays < 0) return { label: "Overdue", status: "overdue" };
  if (diffDays === 0) return { label: "Today", status: "today" };
  if (diffDays === 1) return { label: "Tomorrow", status: "tomorrow" };
  if (diffDays <= 7) return { label: due.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), status: "future" };
  return { label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), status: "future" };
}

export function getCompletedDueLabel(dueDate) {
  if (!dueDate) return "Completed";
  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay - today) / 86400000);
  if (diffDays === 0) return "Completed today";
  if (diffDays === -1) return "Completed yesterday";
  return `Completed ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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
