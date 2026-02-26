/**
 * Context-aware harvest toast message based on task type.
 * Used when a task is marked complete (Home Daily Harvest or Tasks page).
 * Calm & Clever rotation: 70% Generic/Motivational, 20% Zen/Nature, 10% Lenny (rare).
 * - Routine (Breakfast/Lunch/Sleep): "Nourished. ☕" (no seed animation for routine).
 * @param {Object} [task] - Task object { title, due_date, module_id, module_code, moduleId, ... }
 * @returns {string} Message for the toast
 */
const GENERIC_MESSAGES = [
  "Focus maintained. One step closer. ✨",
  "Nicely done. Take a deep breath. 🌱",
  "Momentum is on your side. 🌊",
  "One step closer. Well done. ✨",
  "Steady progress. Keep going. 🌱",
  "Cleared. Breathe. Continue. 🌊",
];

const ZEN_MESSAGES = [
  "A seed planted. The garden grows quiet. 🎋",
  "The sun is high, and your tasks are clear. ☀️",
  "Quiet progress. The path clears. 🎋",
  "Ground under your feet. Clarity ahead. ☀️",
];

const LENNY_MESSAGES = [
  "Lenny the campus cat sends a slow blink of approval. 🐾",
  "Meow-mentum! Lenny approves. 🐾",
];

/** When user checks off an overdue task on Tasks page */
const OVERDUE_HARVEST_MESSAGES = [
  "Phew, just in time! 🌱",
  "Caught it. The garden forgives. 🎋",
  "Better late than never — seed saved. ✨",
  "You showed up. That counts. 🌱",
  "Cleared. Fresh start. ✨",
];

/** When user checks off a due-today task (not overdue) on Tasks page */
const DUE_TODAY_HARVEST_MESSAGES = [
  "Done in time. One less for today. ✨",
  "Today's list just got shorter. 🌱",
  "Just in time. Well done. ✨",
  "Another one for today — crushed. 🌱",
  "On time. The garden approves. 🎋",
];

/** Weighted random: 70% generic, 20% zen, 10% Lenny */
function pickCalmCleverMessage() {
  const r = Math.random();
  if (r < 0.7) return GENERIC_MESSAGES[Math.floor(Math.random() * GENERIC_MESSAGES.length)];
  if (r < 0.9) return ZEN_MESSAGES[Math.floor(Math.random() * ZEN_MESSAGES.length)];
  return LENNY_MESSAGES[Math.floor(Math.random() * LENNY_MESSAGES.length)];
}

/**
 * Context-aware harvest toast message based on task type and due context.
 * Used when a task is marked complete (Home Daily Harvest or Tasks page).
 * @param {Object} [task] - Task object { title, due_date, ... }
 * @param {{ isOverdue?: boolean, dueStatus?: string }} [context] - Optional: isOverdue (Tasks page), dueStatus from formatDueDate ('overdue' | 'today' | 'thisWeek' | 'later')
 * @returns {string} Message for the toast
 */
export function getHarvestMessage(task, context = {}) {
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
    return OVERDUE_HARVEST_MESSAGES[Math.floor(Math.random() * OVERDUE_HARVEST_MESSAGES.length)];
  }
  if (dueStatus === "today") {
    return DUE_TODAY_HARVEST_MESSAGES[Math.floor(Math.random() * DUE_TODAY_HARVEST_MESSAGES.length)];
  }

  return pickCalmCleverMessage();
}

/** True if task is routine by title (meals/sleep). Used to skip victory sound and seed burst. */
export function isRoutineHarvestTask(task) {
  if (!task || typeof task !== "object") return false;
  const title = (task.title || "").toLowerCase();
  return /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title);
}
