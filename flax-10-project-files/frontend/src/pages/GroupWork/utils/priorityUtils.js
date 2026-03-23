/*
 * Shared priority helpers for GroupWork task views.
 */

import priorityColors from './priorityColors.json';

/** Colour tokens for each priority level. */

export const PRIORITY_COLORS = priorityColors;

/** Returns the colour token object for a given priority string, defaulting to low. */

export function getPriorityStyle(priority) {
    const key = (priority || "low").toLowerCase();
    return PRIORITY_COLORS[key] ?? PRIORITY_COLORS.low;
}

/** Ordered list of all valid priority values. */

export const PRIORITY_OPTIONS = ["urgent", "high", "medium", "low"];

const USER_COLORS = [
    "var(--avatar-3)", "var(--avatar-6)", "var(--avatar-1)", "var(--avatar-2)",
    "var(--avatar-4)", "var(--avatar-5)", "var(--color-groupwork-fallback)", "var(--chart-accent-amber)"
];

/** Returns a consistent colour for a user ID by hashing the ID string. */

export function getUserColor(userId) {
    if (!userId) return USER_COLORS[0];
    const idStr = String(userId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
