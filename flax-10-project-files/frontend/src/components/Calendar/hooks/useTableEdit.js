import { useState, useCallback } from 'react';
import { updateEvent } from '../../../api/eventApi';
import { useCalendarDispatch } from '../../../context/CalendarContext';

export function useTableEdit(events) {
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

        const updatedEvent = buildUpdatedEvent(event, editingCell.field, cellValue);
        await updateEvent(updatedEvent.id, updatedEvent);
        dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
        cancelEdit();
    }, [editingCell, cellValue, originalValue, events, dispatch, cancelEdit]);

    return { editingCell, cellValue, startEdit, updateValue, saveEdit, cancelEdit };
}

function buildUpdatedEvent(event, field, value) {
    const updated = { ...event };
    if (field === 'title') updated.title = value;
    if (field === 'location') updated.location = value;
    if (field === 'description') updated.description = value;
    return updated;
}
