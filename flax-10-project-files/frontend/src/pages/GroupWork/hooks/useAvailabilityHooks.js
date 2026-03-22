/*
 * GroupWork availability hooks for loading and updating meeting suggestions.
 */

import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "../api/groupWorkApi";

const INITIAL_DATA = {
    suggestions: [],
    active_suggestions: [],
    current_user_id: null,
    project_members: [],
    team_size: 0,
};

function getAvailabilityUrl(projectId) {
    return `/api/group-work/projects/${projectId}/availability/`;
}

function getSuggestionsUrl(projectId) {
    return `/api/group-work/projects/${projectId}/suggestions/`;
}

function getDeleteSuggestionUrl(id) {
    return `/api/group-work/suggestions/${id}/`;
}

function getVoteUrl(id) {
    return `/api/group-work/suggestions/${id}/respond/`;
}

function readPayload(res) {
    return res.ok ? res.json() : null;
}

function loadAvailability(projectId, setData, setLoading) {
    setLoading(true);
    return fetch(getAvailabilityUrl(projectId), { headers: getAuthHeaders() })
        .then(readPayload)
        .then((payload) => payload && setData(payload))
        .finally(() => setLoading(false));
}

function deleteSuggestion(fetchAvail, id) {
    return fetch(getDeleteSuggestionUrl(id), { method: "DELETE", headers: getAuthHeaders() }).then((res) => res.ok && fetchAvail());
}

export function useAvailabilityData(projectId) {
    const [data, setData] = useState(INITIAL_DATA);
    const [loading, setLoading] = useState(true);
    const fetchAvail = useCallback(() => loadAvailability(projectId, setData, setLoading), [projectId]);

    useEffect(() => {
        fetchAvail();
    }, [fetchAvail]);

    return { data, fetchAvail, loading };
}

export function useSuggestionActions(projectId, fetchAvail, confirm) {
    const onSuggest = async (slot) => {
        const end = new Date(new Date(slot.start).getTime() + 3600000).toISOString();
        const res = await fetch(getSuggestionsUrl(projectId), {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ start_time: slot.start, end_time: end }),
        });
        if (res.ok) fetchAvail();
    };

    const handleDelete = async (id) => {
        const config = { title: "Delete Suggestion", message: "Delete this meeting suggestion?", confirmText: "Delete", isDanger: true };
        if (await confirm(config)) deleteSuggestion(fetchAvail, id);
    };

    return { onSuggest, handleDelete };
}

export function useAvailabilityActions(projectId, fetchAvail, confirm) {
    const { onSuggest, handleDelete } = useSuggestionActions(projectId, fetchAvail, confirm);

    const handleVote = async (id, status) => {
        const res = await fetch(getVoteUrl(id), {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) fetchAvail();
    };

    return { handleSuggestTime: onSuggest, handleDelete, handleVote };
}

export function useActiveMeetingView(proposedSuggestions, confirmedSuggestions) {
    const [activeMeetingView, setActiveMeetingView] = useState("proposed");
    const [hasChosenMeetingView, setHasChosenMeetingView] = useState(false);

    useEffect(() => {
        if (hasChosenMeetingView) return;
        if (!proposedSuggestions.length && confirmedSuggestions.length > 0) setActiveMeetingView("confirmed");
    }, [confirmedSuggestions.length, hasChosenMeetingView, proposedSuggestions.length]);

    const handleViewChange = (nextView) => {
        setHasChosenMeetingView(true);
        setActiveMeetingView(nextView);
    };

    return { activeMeetingView, handleViewChange };
}

export function useAvailability(projectId, confirm) {
    const { data, fetchAvail, loading } = useAvailabilityData(projectId);
    const actions = useAvailabilityActions(projectId, fetchAvail, confirm);
    const [suggestingSlot, setSuggestingSlot] = useState(null);
    const handleSuggestTime = (slot) => actions.handleSuggestTime(slot).then(() => setSuggestingSlot(null));
    return { ...data, loading, suggestingSlot, setSuggestingSlot, ...actions, handleSuggestTime };
}
