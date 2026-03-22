/*
 * Utility constants and pure functions for the availability tab.
 */

import { Check, Clock3, X } from "lucide-react";

export const RESPONSE_META = {
    accepted: { label: "Accepted", Icon: Check },
    rejected: { label: "Rejected", Icon: X },
    pending: { label: "Pending", Icon: Clock3 },
};

export function formatSuggestionDateLabel(value) {
    const date = new Date(value);
    const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
    const day = date.toLocaleDateString("en-GB", { day: "numeric" });
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${weekday} ${day} ${month}, ${time}`;
}

export function getMemberStatuses(suggestion) {
    return Array.isArray(suggestion?.member_statuses) ? suggestion.member_statuses : [];
}

export function getTeamSize(suggestion) {
    return Number(suggestion?.team_size || getMemberStatuses(suggestion).length || 0);
}

export function getSuggestionCount(suggestion, status) {
    const field = `${status}_count`;
    if (typeof suggestion?.[field] === "number") return suggestion[field];
    return getMemberStatuses(suggestion).filter((member) => member.status === status).length;
}

export function getCurrentUserStatus(suggestion, currentUserId) {
    const memberStatus = getMemberStatuses(suggestion).find((member) => member.id === currentUserId);
    if (memberStatus?.status) return memberStatus.status;
    if (suggestion?.suggested_by?.id === currentUserId) return "accepted";
    return "pending";
}

export function splitSuggestions(active_suggestions) {
    const allSuggestions = [...(active_suggestions || [])].sort((left, right) => new Date(left.start) - new Date(right.start));
    return {
        confirmedSuggestions: allSuggestions.filter((s) => s.is_confirmed),
        proposedSuggestions: allSuggestions.filter((s) => !s.is_confirmed),
    };
}
