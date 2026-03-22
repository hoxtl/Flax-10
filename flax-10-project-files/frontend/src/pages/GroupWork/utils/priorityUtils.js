/*
 * Shared priority helpers for GroupWork task views.
 */

export const PRIORITY_COLORS = {
    urgent: { bg: "#f9a8c9", border: "#f472a8", text: "#9b2257", color: "#9b2257", backgroundColor: "#f9a8c9" },
    high: { bg: "#fcd5a8", border: "#f4a872", text: "#9b5a22", color: "#9b5a22", backgroundColor: "#fcd5a8" },
    medium: { bg: "#f5e6a3", border: "#e8d660", text: "#7a6a1a", color: "#7a6a1a", backgroundColor: "#f5e6a3" },
    low: { bg: "#b8e8c8", border: "#60d888", text: "#1a6a3a", color: "#1a6a3a", backgroundColor: "#b8e8c8" },
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
