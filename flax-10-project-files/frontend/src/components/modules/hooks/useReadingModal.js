/*
 * Hook for managing reading modal state and CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { getReadings, createReading, updateReading, deleteReading } from '../../../api/readingApi';
import { useToast } from '../../../context/ToastContext';

function useReadingList(moduleId) {
    const [readings, setReadings] = useState([]);
    const load = useCallback(async () => {
        const data = await getReadings(moduleId);
        setReadings(data || []);
    }, [moduleId]);
    useEffect(() => { load(); }, [load]);
    return { readings, reload: load };
}

function useReadingForm() {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (reading) => { setEditing(reading); setShowForm(true); };
    const close = () => { setEditing(null); setShowForm(false); };
    return { showForm, editing, openCreate, openEdit, close };
}

/** Hook providing reading list state, form visibility, and submit/delete handlers. */

export function useReadingModal(moduleId) {
    const { readings, reload } = useReadingList(moduleId);
    const form = useReadingForm();
    const showToast = useToast();
    const handleSubmit = async (formData) => {
        if (form.editing) await updateReading(moduleId, form.editing.id, formData);
        else await createReading(moduleId, formData);
        showToast(form.editing ? 'Reading updated.' : 'Reading added.', { variant: 'success' });
        await reload();
        form.close();
    };
    const handleDelete = async (id) => {
        await deleteReading(moduleId, id);
        showToast('Reading deleted.', { variant: 'success' });
        await reload();
    };
    return { readings, ...form, handleSubmit, handleDelete };
}
