import { useState, useEffect, useCallback } from "react";
import { fetchSocieties, createSociety } from "../../../api/societyApi";

function toSnakeCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        result[snakeKey] = value;
    }
    return result;
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
        const apiData = toSnakeCase(formData);
        const newSociety = await createSociety(apiData);
        setSocieties(prev => [...prev, newSociety]);
        return newSociety;
    };

    return { societies, loading, error, refresh: loadSocieties, handleCreate };
}
