/*
 * useSocieties loads and mutates the societies collection for the browse pages.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchSocieties, createSociety, addCollaborator, requestRatification } from "../../../api/societyApi";

function toSnakeCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key.replace(/([A-Z])/g, "_$1").toLowerCase()] = value;
    }
    return result;
}

async function addCollaboratorSafely(societyId, collaborator) {
    try {
        await addCollaborator(societyId, collaborator.username, collaborator.role);
        return null;
    } catch (error) {
        return { username: collaborator.username, message: error.message };
    }
}

async function addCollaboratorsToSociety(societyId, collaborators = []) {
    if (!collaborators.length) return [];
    const failures = await Promise.all(collaborators.map((collaborator) => addCollaboratorSafely(societyId, collaborator)));
    return failures.filter(Boolean);
}

async function requestRatificationSafely(societyId, shouldRequest) {
    if (!shouldRequest) return null;
    try {
        await requestRatification(societyId);
        return null;
    } catch (error) {
        return error.message;
    }
}

function buildCreatedSociety(newSociety, collaboratorFailures, ratificationError) {
    return { ...newSociety, is_admin: true, role: "admin", create_meta: { collaboratorFailures, ratificationError } };
}

function appendCreatedSociety(setSocieties, society) {
    const { create_meta, ...societyForList } = society;
    setSocieties((current) => [...current, societyForList]);
}

async function createSocietyWithMetadata(formData) {
    const { collaborators, requestRatification: shouldRequest, ...rest } = formData;
    const newSociety = await createSociety(toSnakeCase(rest));
    const [collaboratorFailures, ratificationError] = await Promise.all([addCollaboratorsToSociety(newSociety.id, collaborators), requestRatificationSafely(newSociety.id, shouldRequest)]);
    return buildCreatedSociety(newSociety, collaboratorFailures, ratificationError);
}

async function loadSocieties(setState, setSocieties) {
    try {
        setState({ loading: true, error: null });
        setSocieties(await fetchSocieties());
    } catch (error) {
        setState({ loading: false, error: error.message });
    } finally {
        setState((current) => ({ ...current, loading: false }));
    }
}

function makeHandleCreate(setSocieties) {
    return async function handleCreate(formData) {
        const society = await createSocietyWithMetadata(formData);
        appendCreatedSociety(setSocieties, society);
        return society;
    };
}

function updateSocietyLocally(setSocieties, id, updates) {
    setSocieties((current) => current.map((society) => society.id === id ? { ...society, ...updates } : society));
}

function removeSocietyFromList(setSocieties, id) {
    setSocieties((current) => current.filter((society) => society.id !== id));
}

/** Exposes societies data plus local list mutation helpers for the societies page. */
export function useSocieties() {
    const [societies, setSocieties] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });
    const load = useCallback(() => loadSocieties(setState, setSocieties), []);
    useEffect(() => { load(); }, [load]);
    return { societies, ...state, refresh: load, handleCreate: makeHandleCreate(setSocieties), updateSocietyLocally: (id, updates) => updateSocietyLocally(setSocieties, id, updates), removeSociety: (id) => removeSocietyFromList(setSocieties, id) };
}
