/*
 * Pure data helpers for the GroupWork availability tab.
 */

/** Formats a meeting slot start time as a human-readable GB date/time string. */

export function formatSuggestionDateLabel(value) {
    const date = new Date(value);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
    const day = date.toLocaleDateString("en-GB", { day: "numeric" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${weekday} ${day} ${month}, ${time}`;
}

/** Returns the member_statuses array for a suggestion, or an empty array. */

export function getMemberStatuses(suggestion) {
    return Array.isArray(suggestion?.member_statuses) ? suggestion.member_statuses : [];
}

/** Returns the team size for a suggestion, falling back to the member status count. */

export function getTeamSize(suggestion) {
    return Number(suggestion?.team_size || getMemberStatuses(suggestion).length || 0);
}

/** Returns the response count for a given status on a suggestion. */

export function getSuggestionCount(suggestion, status) {
    const field = `${status}_count`;
    if (typeof suggestion?.[field] === "number") return suggestion[field];
    return getMemberStatuses(suggestion).filter((member) => member.status === status).length;
}

/** Returns the current user's response status for a suggestion. */

export function getCurrentUserStatus(suggestion, currentUserId) {
    const memberStatus = getMemberStatuses(suggestion).find((member) => member.id === currentUserId);
    if (memberStatus?.status) return memberStatus.status;
    if (suggestion?.suggested_by?.id === currentUserId) return "accepted";
    return "pending";
}
