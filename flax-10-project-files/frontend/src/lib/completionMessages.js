/*
 * Context-aware completion toast messages for task completion.
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

const OVERDUE_MESSAGES = [
  "Caught up. Well recovered.",
  "Better late than never.",
  "You showed up. That counts.",
  "Cleared. Fresh start.",
  "Back on track.",
];

const DUE_TODAY_MESSAGES = [
  "Done in time. One less for today.",
  "Today's list just got shorter.",
  "Just in time. Well done.",
  "Another one for today — done.",
  "Right on schedule.",
];

const ROUTINE_PATTERN = /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** Weighted random: 70% generic, 20% reflective, 10% Lenny. */
function pickCalmCleverMessage() {
  const r = Math.random();
  if (r < 0.7) return pickRandom(GENERIC_MESSAGES);
  if (r < 0.9) return pickRandom(REFLECTIVE_MESSAGES);
  return pickRandom(LENNY_MESSAGES);
}

function pickContextualMessage({ isOverdue, dueStatus }) {
  if (isOverdue || dueStatus === "overdue") return pickRandom(OVERDUE_MESSAGES);
  if (dueStatus === "today") return pickRandom(DUE_TODAY_MESSAGES);
  return pickCalmCleverMessage();
}

/** Returns a completion toast message based on task type and due context. */
export function getCompletionMessage(task, context = {}) {
  if (!task || typeof task !== "object") return pickCalmCleverMessage();
  if (isRoutineTask(task)) return "Nourished. ☕";
  return pickContextualMessage(context);
}

/** True if task is routine by title (meals/sleep). Used to skip victory sound. */
export function isRoutineTask(task) {
  if (!task || typeof task !== "object") return false;
  return ROUTINE_PATTERN.test(task.title || "");
}
