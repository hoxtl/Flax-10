/*
 * GroupWork project row helpers.
 */

export const PROJECT_THEMES = {
  red: { pill: "daysRed", ring: "#ef4444" },
  orange: { pill: "daysOrange", ring: "#f97316" },
  yellow: { pill: "daysYellow", ring: "#eab308" },
  green: { pill: "daysGreen", ring: "#22c55e" },
  blue: { pill: "daysBlue", ring: "#3b82f6" },
  grey: { pill: "daysGrey", ring: "#94a3b8" },
};

export function getProjectTheme(daysLeft) {
  if (daysLeft === null) return PROJECT_THEMES.blue;
  if (daysLeft <= 7) return PROJECT_THEMES.red;
  if (daysLeft <= 14) return PROJECT_THEMES.orange;
  if (daysLeft <= 30) return PROJECT_THEMES.yellow;
  return PROJECT_THEMES.green;
}

export function getProjectDate(deadline) {
  return deadline ? new Date(deadline) : null;
}

export function formatProjectDate(date) {
  if (!date) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getDaysLeft(date) {
  if (!date) return null;
  return Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
}

export function getProjectPercent(project) {
  const total = project.task_count || 0;
  const completed = project.completed_task_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function getProjectMembers(project) {
  return project.members || [];
}
