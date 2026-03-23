/*
 * Hook for managing deadline modal state and CRUD operations.
 */

import { useState, useEffect } from 'react';
import { getDeadlines, createDeadline, updateDeadline, deleteDeadline } from '../../../api/deadlineApi';

function useDeadlineList(module_id) {
    const [deadlines, setDeadlines] = useState([]);
    useEffect(() => { getDeadlines(module_id).then(setDeadlines); }, [module_id]);
    const add = (d) => setDeadlines(prev => [...prev, d]);
    const update = (d) => setDeadlines(prev => prev.map(x => x.id === d.id ? d : x));
    const remove = (id) => setDeadlines(prev => prev.filter(x => x.id !== id));
    return { deadlines, add, update, remove };
}

function useDeadlineForm(startCreating) {
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(!!startCreating);
    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (d) => { setEditing(d); setShowForm(true); };
    const close = () => { setEditing(null); setShowForm(false); };
    return { editing, showForm, openCreate, openEdit, close, setShowForm };
}

async function saveDeadline(module_id, editing, data) {
    const payload = { ...data, end_due_date: data.end_due_date || null };
    if (editing) return updateDeadline(module_id, editing.id, payload);
    return createDeadline(module_id, payload);
}

export function useDeadlineModal(module_id, startCreating) {
    const list = useDeadlineList(module_id);
    const form = useDeadlineForm(startCreating);

    const handleSubmit = async (data) => {
        const saved = await saveDeadline(module_id, form.editing, data);
        form.editing ? list.update(saved) : list.add(saved);
        form.close();
    };

    const handleDelete = async (id) => {
        await deleteDeadline(module_id, id);
        list.remove(id);
    };

    return { ...list, ...form, handleSubmit, handleDelete };
}
