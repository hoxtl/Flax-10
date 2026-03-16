export const SESSION_MILESTONES = [10, 25, 50, 100, 150, 200, 250, 500];
export const STREAK_MILESTONES  = [3, 7, 14, 30, 60, 100];
export const HOURS_MILESTONES   = [5, 10, 25, 50, 100, 200];

/**
 * Finds the single closest upcoming milestone across sessions, streak, and hours.
 * @param {number} totalSessions - all-time completed sessions
 * @param {number} streakDays    - current streak in days
 * @param {number} totalHours    - all-time study hours
 * @returns {{ type, target, current, remaining, label } | null}
 */
export function getNearestMilestone(totalSessions, streakDays, totalHours) {
    const candidates = [];

    for (const m of SESSION_MILESTONES) {
        if (m > totalSessions) {
            candidates.push({
                type: 'sessions',
                target: m,
                current: totalSessions,
                remaining: m - totalSessions,
                label: `${m} sessions`,
            });
            break;
        }
    }

    for (const m of STREAK_MILESTONES) {
        if (m > streakDays) {
            candidates.push({
                type: 'streak',
                target: m,
                current: streakDays,
                remaining: m - streakDays,
                label: `${m}-day streak`,
            });
            break;
        }
    }

    for (const m of HOURS_MILESTONES) {
        if (m > totalHours) {
            candidates.push({
                type: 'hours',
                target: m,
                current: totalHours,
                remaining: m - totalHours,
                label: `${m} study hours`,
            });
            break;
        }
    }

    if (!candidates.length) return null;
    return candidates.sort((a, b) => a.remaining - b.remaining)[0];
}
