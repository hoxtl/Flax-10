import { useState, useCallback } from 'react';
import { updateEvent } from '../../../api/eventApi';
import { useCalendarDispatch } from '../../../context/CalendarContext';

export function useTableEdit(events, tags = []) {
    const dispatch = useCalendarDispatch();
    const [editingCell, setEditingCell] = useState(null);
    const [cellValue, setCellValue] = useState('');
    const [originalValue, setOriginalValue] = useState('');

    const startEdit = useCallback((eventId, field, value) => {
        setEditingCell({ eventId, field });
        setCellValue(value ?? '');
        setOriginalValue(value ?? '');
    }, []);

    const updateValue = useCallback((value) => {
        setCellValue(value);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setCellValue('');
        setOriginalValue('');
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editingCell || cellValue === originalValue) {
            cancelEdit();
            return;
        }

        const event = events.find(e => e.id === editingCell.eventId);
        if (!event) { cancelEdit(); return; }

        const updatedEvent = buildUpdatedEvent(event, editingCell.field, cellValue, tags);
        await updateEvent(updatedEvent.id, updatedEvent);
        dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
        cancelEdit();
    }, [editingCell, cellValue, originalValue, events, tags, dispatch, cancelEdit]);

    const saveWithValue = useCallback(async (value) => {
        if (!editingCell || value === originalValue) {
            cancelEdit();
            return;
        }

        const event = events.find(e => e.id === editingCell.eventId);
        if (!event) { cancelEdit(); return; }

        const updatedEvent = buildUpdatedEvent(event, editingCell.field, value, tags);
        await updateEvent(updatedEvent.id, updatedEvent);
        dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
        cancelEdit();
    }, [editingCell, originalValue, events, tags, dispatch, cancelEdit]);

    const saveDateTimes = useCallback(async (eventId, times) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const updatedEvent = { ...event, start_time: times.start_time, end_time: times.end_time };
        await updateEvent(updatedEvent.id, updatedEvent);
        dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
    }, [events, dispatch]);

    return { editingCell, cellValue, startEdit, updateValue, saveEdit, saveWithValue, saveDateTimes, cancelEdit };
}

function buildUpdatedEvent(event, field, value, tags) {
    const updated = { ...event };
    if (field === 'title') updated.title = value;
    if (field === 'location') updated.location = value;
    if (field === 'description') updated.description = value;
    if (field === 'tag') {
        updated.tag = value || null;
        updated.tag_id = value || null;
        const tagObj = tags.find(t => t.id === value || t.id === Number(value));
        updated.tag_name = tagObj?.label || null;
    }
    return updated;
}
