/*
 * Hook for managing reading modal state and CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { getReadings, createReading, updateReading, deleteReading } from '../../../api/readingApi';

function useReadingList(moduleId) {
    const [readings, setReadings] = useState([]);
    const load = useCallback(async () => {
        const data = await getReadings(moduleId);
        setReadings(data || []);
    }, [moduleId]);

    useEffect(() => {
        let active = true;
        getReadings(moduleId).then((data) => {
            if (active) setReadings(data || []);
        });
        return () => { active = false; };
    }, [moduleId]);

    const reload = useCallback(() => load(), [load]);
    return { readings, load: reload };
}

function useReadingForm() {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (reading) => { setEditing(reading); setShowForm(true); };
    const close = () => { setEditing(null); setShowForm(false); };

    return { showForm, editing, openCreate, openEdit, close };
}

export function useReadingModal(moduleId) {
    const { readings, load } = useReadingList(moduleId);
    const { showForm, editing, openCreate, openEdit, close } = useReadingForm();

    const handleSubmit = async (formData) => {
        if (editing) await updateReading(moduleId, editing.id, formData);
        else await createReading(moduleId, formData);
        await load();
        close();
    };

    const handleDelete = async (id) => {
        await deleteReading(moduleId, id);
        await load();
    };

    return { readings, showForm, editing, openCreate, openEdit, close, handleSubmit, handleDelete };
}
