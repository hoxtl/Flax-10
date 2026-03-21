/*
 * Random messages and helpers for the all-tasks-complete celebration state.
 */

export const CLEAR_MESSAGES = [
  "All clear — you've earned a break.",
  "Nothing pending. Well done, you.",
  "Slate wiped clean. Go enjoy something.",
  "Everything handled. Deep breath.",
  "Done for the day. That's momentum.",
  "Zero tasks. Maximum satisfaction.",
];

export const CLEAR_CTAS = [
  "Feel like doing more?",
  "Plan tomorrow's tasks",
  "Add something new?",
  "Keep the streak going?",
];

export function getClearMessage() {
  return CLEAR_MESSAGES[Math.floor(Math.random() * CLEAR_MESSAGES.length)];
}

export function getClearCtaLabel() {
  return CLEAR_CTAS[Math.floor(Math.random() * CLEAR_CTAS.length)];
}

export function areAllTasksCompleted(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return false;
  return tasks.every((t) => !!t.completed);
}
