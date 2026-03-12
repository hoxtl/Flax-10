import { useState, useEffect, useCallback } from 'react';
import * as api from '../../../api/societyApi';

export const useSocietyCore = (id) => {
    const [society, setSociety] = useState({ tags: [], announcements: [], events: [] });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSociety = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await api.fetchSociety(id);
            setSociety(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [id]);

    const updateSociety = async (data) => {
        try {
            await api.updateSociety(id, data);
            await fetchSociety();
        } catch (err) { setError(err.message); }
    };

    const deleteSociety = async () => {
        try { await api.deleteSociety(id); }
        catch (err) { setError(err.message); }
    };

    const updateLocalSociety = useCallback((fields) => {
        setSociety(prev => ({ ...prev, ...fields }));
    }, []);

    useEffect(() => { fetchSociety(); }, [fetchSociety]);

    return { 
        society, setSociety, error, setError, loading, 
        fetchSociety, updateSociety, deleteSociety, updateLocalSociety 
    };
};
