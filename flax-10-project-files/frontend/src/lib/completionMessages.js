/**
 * Messages and helpers for task completion toasts and routine detection.
 */

export function getCompletionMessage(task, context = {}) {
  if (!task) return "Task completed!";
  const title = task.title || "Task";
  return `${title} completed!`;
}

export function isRoutineTask(task) {
  if (!task) return false;
  return !!(task.recurrence_rule || task.is_routine);
}
