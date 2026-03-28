/*
 * Availability data and action hooks for the GroupWork tab.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthHeaders } from "./groupWorkHooks";
import { useToast } from "../../../context/ToastContext";

const DEFAULT_AVAILABILITY_DATA = {
    suggestions: [],
    active_suggestions: [],
    current_user_id: null,
    project_members: [],
    team_size: 0,
};

function setAvailabilityLoading(background, hasLoadedRef, setLoading) {
    if (background && hasLoadedRef.current) return;
    setLoading(true);
}

async function fetchAvailabilityPayload(projectId) {
    const res = await fetch(`/api/group-work/projects/${projectId}/availability/`, { headers: getAuthHeaders() });
    return res.ok ? res.json() : null;
}

function storeAvailabilityPayload(payload, setData, hasLoadedRef) {
    if (!payload) return;
    setData(payload);
    hasLoadedRef.current = true;
}

function useAvailabilityData(projectId) {
    const [data, setData] = useState(DEFAULT_AVAILABILITY_DATA);
    const [loading, setLoading] = useState(true);
    const hasLoadedRef = useRef(false);

    const fetchAvail = useCallback(async ({ background = false } = {}) => {
        setAvailabilityLoading(background, hasLoadedRef, setLoading);
        try {
            const payload = await fetchAvailabilityPayload(projectId);
            storeAvailabilityPayload(payload, setData, hasLoadedRef);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchAvail(); }, [fetchAvail]);
    return { data, fetchAvail, loading };
}

function buildSuggestionActions(projectId, fetchAvail, showToast) {
    const onSuggest = async (slot) => {
        const end = new Date(new Date(slot.start).getTime() + 3600000).toISOString();
        const res = await fetch(`/api/group-work/projects/${projectId}/suggestions/`, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ start_time: slot.start, end_time: end }),
        });
        if (res.ok) { await fetchAvail({ background: true }); showToast("You proposed a time for the team."); }
    };
    const onDelete = async (id) => {
        const res = await fetch(`/api/group-work/suggestions/${id}/`, { method: "DELETE", headers: getAuthHeaders() });
        if (res.ok) { await fetchAvail({ background: true }); showToast("Meeting suggestion deleted."); }
    };
    return { onSuggest, onDelete };
}

function useAvailabilityActions(projectId, fetchAvail, confirm) {
    const showToast = useToast();
    const { onSuggest, onDelete } = buildSuggestionActions(projectId, fetchAvail, showToast);
    const handleDelete = async (id) => {
        const config = { title: "Delete Suggestion", message: "Delete this meeting suggestion?", confirmText: "Delete", isDanger: true };
        if (await confirm(config)) onDelete(id);
    };
    const handleVote = async (id, status) => {
        const res = await fetch(`/api/group-work/suggestions/${id}/respond/`, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) return;
        await fetchAvail({ background: true });
        const msg = status === "accepted" ? "You accepted the meeting slot." : "You declined the meeting slot.";
        showToast(msg, { variant: status === "accepted" ? "success" : "neutral" });
    };
    return { handleSuggestTime: onSuggest, handleDelete, handleVote };
}

/*
 * Provides availability data and actions for meeting suggestions.
 */

export function useAvailability(projectId, confirm) {
    const { data, fetchAvail, loading } = useAvailabilityData(projectId);
    const actions = useAvailabilityActions(projectId, fetchAvail, confirm);
    const [suggestingSlot, setSuggestingSlot] = useState(null);
    const suggest = (slot) => actions.handleSuggestTime(slot).then(() => setSuggestingSlot(null));
    return { ...data, loading, suggestingSlot, setSuggestingSlot, ...actions, handleSuggestTime: suggest };
}
