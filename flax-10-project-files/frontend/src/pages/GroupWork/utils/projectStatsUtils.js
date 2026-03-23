/*
 * GroupWork project stats helpers.
 */

/** Returns the number of whole days until targetDate, or null if it has passed. */

export function calculateDays(targetDate) {
  if (!targetDate) return null;
  const diffTime = new Date(targetDate) - new Date();
  if (diffTime < 0) return null;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/** Returns the number of distinct module codes across the given projects. */

export function getModulesCount(projects) {
  return new Set(projects.map((project) => project.course_code).filter(Boolean)).size;
}

/** Returns the project with the nearest upcoming deadline and its days-remaining count. */

export function getNextDeadline(projects) {
  return projects.reduce(findEarlierDeadline, { days: Infinity, project: null });
}

function findEarlierDeadline(current, project) {
  const days = calculateDays(project.deadline);
  return days !== null && days < current.days ? { days, project } : current;
}

/** Returns the total number of collaborators across all projects. */

export function getCollaboratorCount(projects) {
  return projects.reduce(sumCollaborators, 0);
}

function sumCollaborators(total, project) {
  return total + (project.members ? project.members.length : (project.member_count || 1));
}

/** Returns overall task totals and completion percentage across all projects. */

export function getProgressStats(projects) {
  const total = projects.reduce(sumTaskCount, 0);
  const completed = projects.reduce(sumCompletedTaskCount, 0);
  return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function sumTaskCount(total, project) {
  return total + (project.task_count || 0);
}

function sumCompletedTaskCount(total, project) {
  return total + (project.completed_task_count || 0);
}
