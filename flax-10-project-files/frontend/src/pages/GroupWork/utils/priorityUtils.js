/**
 * Shared priority helpers for GroupWork task views.
 * Single source of truth for priority colors and styles.
 */

export const PRIORITY_COLORS = {
    urgent: { backgroundColor: "#f9a8c9", color: "#9b2257", bg: "#f9a8c9", text: "#9b2257" },
    high: { backgroundColor: "#fcd5a8", color: "#9b5a22", bg: "#fcd5a8", text: "#9b5a22" },
    medium: { backgroundColor: "#f5e6a3", color: "#7a6a1a", bg: "#f5e6a3", text: "#7a6a1a" },
    low: { backgroundColor: "#b8e8c8", color: "#1a6a3a", bg: "#b8e8c8", text: "#1a6a3a" },
};

export function getPriorityStyle(priority) {
    const key = (priority || "low").toLowerCase();
    return PRIORITY_COLORS[key] ?? PRIORITY_COLORS.low;
}

export const PRIORITY_OPTIONS = ["urgent", "high", "medium", "low"];

const USER_COLORS = [
    "#7B6751", "#C0714E", "#7BB38E", "#9A8CB0",
    "#7B9BAD", "#C4A46D", "#8A7060", "#b08c4b"
];

export function getUserColor(userId) {
    if (!userId) return USER_COLORS[0];
    const idStr = String(userId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
