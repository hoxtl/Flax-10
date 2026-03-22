/*
 * Shared GroupWork task helpers.
 */

/** Saves an edited task title if it changed, then exits edit mode. */
export function saveTaskTitle(editTitle, setEditing, task, onUpdate) {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    setEditing(false);
}

/** Enters inline edit mode for a task title. */
export function startTaskEdit(setEditing, setEditTitle, title) {
    setEditing(true);
    setEditTitle(title);
}

export function buildToggleAssignee(assignees, taskId, onUpdate) {
  return (userId) => {
    const currentIds = assignees.map((assignee) => assignee.id);
    const next = currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId];
    onUpdate(taskId, { assigned_to: next });
  };
}

export function filterVisibleAssignees(assignees, members) {
  if (!Array.isArray(assignees) || !Array.isArray(members)) return assignees || [];
  const memberByUserId = Object.fromEntries(members.map((m) => [String(m.user), m]));
  return assignees
    .filter((assignee) => memberByUserId[String(assignee.id)])
    .map((assignee) => ({ ...memberByUserId[String(assignee.id)], id: assignee.id }));
}

export function handleDragStartTask(e, taskId) {
  e.dataTransfer.setData("text/plain", String(taskId));
}

export function getDueDateStr(due_date) {
  if (!due_date) return "";
  return new Date(due_date).toISOString().slice(0, 10);
}

export function formatTaskDueDate(dueDate) {
  if (!dueDate) return "";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return null;
  return formatDeadlineLabel(due, Math.round((due - new Date()) / (1000 * 60 * 60 * 24)));
}

function formatDeadlineLabel(due, diffDays) {
  if (diffDays < 0) return "Past due";
  if (diffDays === 0) return "Due today";
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return due.toLocaleDateString();
}

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };

export function sortTasks(tasks) {
  return [...tasks].sort(compareTasks);
}

function compareTasks(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const wA = PRIORITY_WEIGHT[(a.priority || "medium").toLowerCase()] || 0;
  const wB = PRIORITY_WEIGHT[(b.priority || "medium").toLowerCase()] || 0;
  if (wA !== wB) return wB - wA;
  return new Date(a.created_at) - new Date(b.created_at);
}
