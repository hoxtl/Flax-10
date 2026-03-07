/**
 * Context-aware completion toast message based on task type.
 * Used when a task is marked complete (Homepage or Tasks page).
 * Calm & Clever rotation: 70% Generic/Motivational, 20% Reflective, 10% Lenny (rare).
 * - Routine (Breakfast/Lunch/Sleep): "Nourished. ☕" (no particle animation for routine).
 * @param {Object} [task] - Task object { title, due_date, module_id, module_code, moduleId, ... }
 * @returns {string} Message for the toast
 */
const GENERIC_MESSAGES = [
  "Focus maintained. One step closer.",
  "Nicely done. Take a deep breath.",
  "Momentum is on your side.",
  "One step closer. Well done.",
  "Steady progress. Keep going.",
  "Cleared. Breathe. Continue.",
];

const REFLECTIVE_MESSAGES = [
  "Quiet progress. The path clears.",
  "Ground under your feet. Clarity ahead.",
  "Well composed. Onward.",
  "Precision pays off. Next.",
];

const LENNY_MESSAGES = [
  "Lenny the campus cat sends a slow blink of approval.",
  "Even Lenny approves of that one.",
];

/** When user checks off an overdue task on Tasks page */
const OVERDUE_MESSAGES = [
  "Caught up. Well recovered.",
  "Better late than never.",
  "You showed up. That counts.",
  "Cleared. Fresh start.",
  "Back on track.",
];

/** When user checks off a due-today task (not overdue) on Tasks page */
const DUE_TODAY_MESSAGES = [
  "Done in time. One less for today.",
  "Today's list just got shorter.",
  "Just in time. Well done.",
  "Another one for today — done.",
  "Right on schedule.",
];

/** Weighted random: 70% generic, 20% reflective, 10% Lenny */
function pickCalmCleverMessage() {
  const r = Math.random();
  if (r < 0.7) return GENERIC_MESSAGES[Math.floor(Math.random() * GENERIC_MESSAGES.length)];
  if (r < 0.9) return REFLECTIVE_MESSAGES[Math.floor(Math.random() * REFLECTIVE_MESSAGES.length)];
  return LENNY_MESSAGES[Math.floor(Math.random() * LENNY_MESSAGES.length)];
}

/**
 * Context-aware completion toast message based on task type and due context.
 * @param {Object} [task] - Task object { title, due_date, ... }
 * @param {{ isOverdue?: boolean, dueStatus?: string }} [context]
 * @returns {string} Message for the toast
 */
export function getCompletionMessage(task, context = {}) {
  if (!task || typeof task !== "object") {
    return pickCalmCleverMessage();
  }

  const title = (task.title || "").toLowerCase();
  const isRoutine = /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title);

  if (isRoutine) {
    return "Nourished. ☕";
  }

  const { isOverdue, dueStatus } = context;
  if (isOverdue || dueStatus === "overdue") {
    return OVERDUE_MESSAGES[Math.floor(Math.random() * OVERDUE_MESSAGES.length)];
  }
  if (dueStatus === "today") {
    return DUE_TODAY_MESSAGES[Math.floor(Math.random() * DUE_TODAY_MESSAGES.length)];
  }

  return pickCalmCleverMessage();
}

/** True if task is routine by title (meals/sleep). Used to skip victory sound and particle burst. */
export function isRoutineTask(task) {
  if (!task || typeof task !== "object") return false;
  const title = (task.title || "").toLowerCase();
  return /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title);
}
