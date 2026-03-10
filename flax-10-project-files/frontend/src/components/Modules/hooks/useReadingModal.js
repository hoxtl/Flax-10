import {useState, useEffect, useCallback} from 'react';
import {getReadings, createReading, updateReading, deleteReading} from '../../../api/readingApi';

export function useReadingModal(moduleId) {
    const [readings, setReadings] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        const data = await getReadings(moduleId);
        setReadings(data || []);
    }, [moduleId]);

    useEffect(() => {load(); }, [load]);

    const openCreate = () => {setEditing(null); setShowForm(true); };
    const openEdit = (reading) => {setEditing(reading); setShowForm(true); };
    const close = () => {setEditing(null); setShowForm(false); };

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

    return {readings, showForm, editing, openCreate, openEdit, close, handleSubmit, handleDelete};
}