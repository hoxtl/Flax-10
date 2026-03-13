import { useState, useEffect, useCallback } from "react";
import { fetchSocieties, createSociety, addCollaborator, requestRatification } from "../../../api/societyApi";

function toSnakeCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        result[snakeKey] = value;
    }
    return result;
}

async function addCollaboratorsToSociety(societyId, collaborators) {
    if (!collaborators?.length) return;
    for (const c of collaborators) await addCollaborator(societyId, c.username, c.role);
}

const loadSocieties = async (setState, setSocieties) => {
    try {
        setState({ loading: true, error: null });
        setSocieties(await fetchSocieties());
    } catch (err) { setState({ loading: false, error: err.message }); }
    finally { setState(s => ({ ...s, loading: false })); }
};

const makeHandleCreate = (setSocieties) =>
    async (formData) => {
        const { collaborators, requestRatification: shouldRequest, ...rest } = formData;
        const newSociety = await createSociety(toSnakeCase(rest));
        await addCollaboratorsToSociety(newSociety.id, collaborators);
        if (shouldRequest) await requestRatification(newSociety.id);
        setSocieties(prev => [...prev, newSociety]);
        return newSociety;
    };

const updateSocietyLocally = (setSocieties, id, updates) =>
    setSocieties(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

export function useSocieties() {
    const [societies, setSocieties] = useState([]);
    const [state, setState] = useState({ loading: true, error: null });
    const load = useCallback(() => loadSocieties(setState, setSocieties), []);
    useEffect(() => { load(); }, [load]);
    return {
        societies, ...state, refresh: load,
        handleCreate: makeHandleCreate(setSocieties),
        updateSocietyLocally: (id, u) => updateSocietyLocally(setSocieties, id, u),
    };
}
