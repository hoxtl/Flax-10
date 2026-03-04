/**
 * Task helpers for timeline (fit-in-gap suggestions, duration).
 */

/**
 * @param {object} task
 * @returns {number} estimated duration in minutes
 */
export function taskDurationMins(task) {
  if (!task) return 25;
  const blocks = task.estimated_blocks ?? task.estimated_blocks_count ?? 1;
  return Math.max(1, Number(blocks)) * 25;
}

/**
 * @param {object[]} tasks
 * @param {number} gapMinutes
 * @returns {{ suggested: object | null, top3: object[] }}
 */
export function getTasksThatFitGap(tasks, gapMinutes) {
  if (!Array.isArray(tasks) || gapMinutes <= 0) return { suggested: null, top3: [] };
  const maxMins = Math.floor(gapMinutes);
  const fit = tasks
    .filter((t) => {
      const dur = taskDurationMins(t);
      return dur <= maxMins;
    })
    .slice(0, 3);
  return {
    suggested: fit[0] ?? null,
    top3: fit,
  };
}
