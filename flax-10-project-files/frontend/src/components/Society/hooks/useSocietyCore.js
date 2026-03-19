/*
 * useSocietyCore manages the core society detail fetch and update flow.
 */
import { useState, useEffect, useCallback } from 'react';
import * as api from '../../../api/societyApi';

const initialState = { tags: [], announcements: [], events: [] };

export const useSocietyCore = (id) => {
    const [society, setSociety] = useState(initialState);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSociety = useCallback(() => fetchSocietyData(id, setSociety, setError, setLoading), [id]);
    const updateSociety = (data) => updateSocietyData(id, data, fetchSociety, setError);
    const deleteSociety = () => deleteSocietyData(id, setError);
    const updateLocalSociety = useCallback((fields) => setSociety(prev => ({ ...prev, ...fields })), []);

    useEffect(() => { fetchSociety(); }, [fetchSociety]);

    return { society, setSociety, error, setError, loading, fetchSociety, updateSociety, deleteSociety, updateLocalSociety };
};

async function fetchSocietyData(id, setSociety, setError, setLoading) {
    if (!id) return;
    try {
        setLoading(true);
        setSociety(await api.fetchSociety(id));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
}

async function updateSocietyData(id, data, fetchSociety, setError) {
    try {
        await api.updateSociety(id, data);
        await fetchSociety();
    } catch (err) { setError(err.message); }
}

async function deleteSocietyData(id, setError) {
    try { await api.deleteSociety(id); }
    catch (err) { setError(err.message); }
}
