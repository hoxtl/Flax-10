/*
 * Timer feature file.
 */

export const SESSION_MILESTONES = [10, 25, 50, 100, 150, 200, 250, 500];
export const STREAK_MILESTONES  = [3, 7, 14, 30, 60, 100];
export const HOURS_MILESTONES   = [5, 10, 25, 50, 100, 200];

/*
 * Finds the closest upcoming milestone across sessions, streak, and hours.
 */

function findNextMilestone(type, current, milestones, labelBuilder) {
    const target = milestones.find((value) => value > current);
    if (!target) return null;
    return { type, target, current, remaining: target - current, label: labelBuilder(target) };
}

export function getNearestMilestone(totalSessions, streakDays, totalHours) {
    const candidates = [
        findNextMilestone('sessions', totalSessions, SESSION_MILESTONES, (value) => `${value} sessions`),
        findNextMilestone('streak', streakDays, STREAK_MILESTONES, (value) => `${value}-day streak`),
        findNextMilestone('hours', totalHours, HOURS_MILESTONES, (value) => `${value} study hours`),
    ].filter(Boolean);
    if (!candidates.length) return null;
    return candidates.sort((a, b) => a.remaining - b.remaining)[0];
}
