/**
 * Weekly seed count per day (for garden/chart).
 * tasks: list of tasks; getSeeds: (task) => number or boolean (counts as seed).
 * Returns array of 7 numbers (Sun–Sat) or object { dayKey: count }.
 */
const DAY_MS = 86400000;

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function getSeedsPerDayThisWeek(tasks, getSeeds) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const out = [0, 0, 0, 0, 0, 0, 0];
  if (!Array.isArray(tasks) || !tasks.length) return out;
  for (const task of tasks) {
    const count = getSeeds(task);
    const n = typeof count === "number" ? count : count ? 1 : 0;
    if (n <= 0) continue;
    const completed = task.completed_at || task.completed;
    const date = completed ? new Date(completed) : new Date();
    const dayStart = getWeekStart(date);
    const dayIndex = Math.floor((dayStart - weekStart) / DAY_MS);
    if (dayIndex >= 0 && dayIndex < 7) out[dayIndex] += n;
  }
  return out;
}
