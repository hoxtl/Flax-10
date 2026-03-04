/**
 * Messages and helpers for task completion toasts and routine detection.
 * Generic celebration copy only (no task name). Picked at random.
 */

const CELEBRATION_MESSAGES = [
  "Nice work!",
  "Well done!",
  "Focus rewarded.",
  "Another one down.",
  "Crushed it.",
  "Keep the momentum.",
  "You're on fire.",
  "Nice one!",
  "Task complete.",
  "Done! ✓",
];

export function getCompletionMessage(task, context = {}) {
  const idx = Math.floor(Math.random() * CELEBRATION_MESSAGES.length);
  return CELEBRATION_MESSAGES[idx];
}

export function isRoutineTask(task) {
  if (!task) return false;
  return !!(task.recurrence_rule || task.is_routine);
}
