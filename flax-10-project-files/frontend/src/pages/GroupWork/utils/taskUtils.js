/**
 * Shared utility for toggling a task assignee.
 * Eliminates duplication across TaskListView, TaskBoardView, TaskTimelineView.
 */
export function buildToggleAssignee(assignees, taskId, onUpdate) {
    return (userId) => {
        const currentIds = assignees.map(a => a.id);
        const next = currentIds.includes(userId)
            ? currentIds.filter(id => id !== userId)
            : [...currentIds, userId];
        onUpdate(taskId, { assigned_to: next });
    };
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
    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((due - now) / oneDayMs);
    if (diffDays < 0) return "Past due";
    if (diffDays === 0) return "Due today";
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return due.toLocaleDateString();
}

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };

export function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const wA = PRIORITY_WEIGHT[(a.priority || "medium").toLowerCase()] || 0;
        const wB = PRIORITY_WEIGHT[(b.priority || "medium").toLowerCase()] || 0;
        if (wA !== wB) return wB - wA;
        return new Date(a.created_at) - new Date(b.created_at);
    });
}
