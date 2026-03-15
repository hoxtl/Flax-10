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

export function useSocieties() {
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadSocieties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchSocieties();
            setSocieties(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSocieties(); }, [loadSocieties]);

    const handleCreate = async (formData) => {
        const { collaborators, requestRatification: shouldRequest, ...rest } = formData;
        const apiData = toSnakeCase(rest);
        const newSociety = await createSociety(apiData);
        await addCollaboratorsToSociety(newSociety.id, collaborators);
        if (shouldRequest) await requestRatification(newSociety.id);
        setSocieties(prev => [...prev, newSociety]);
        return newSociety;
    };

    const updateSocietyLocally = (id, updates) => {
        setSocieties(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    return { societies, loading, error, refresh: loadSocieties, handleCreate, updateSocietyLocally };
}
