/*
 * Shared GroupWork task helpers.
 */
export function buildToggleAssignee(assignees, taskId, onUpdate) {
  return (userId) => {
    const currentIds = assignees.map((assignee) => assignee.id);
    const next = currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId];
    onUpdate(taskId, { assigned_to: next });
  };
}

export function filterVisibleAssignees(assignees, members) {
  if (!Array.isArray(assignees) || !Array.isArray(members)) return assignees || [];
  const memberIds = new Set(members.map((member) => String(member.user)));
  return assignees.filter((assignee) => memberIds.has(String(assignee.id)));
}

export function handleDragStartTask(e, taskId) {
  e.dataTransfer.setData("text/plain", String(taskId));
}

export function getDueDateStr(due_date) {
  if (!due_date) return "";
  return new Date(due_date).toISOString().slice(0, 10);
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
