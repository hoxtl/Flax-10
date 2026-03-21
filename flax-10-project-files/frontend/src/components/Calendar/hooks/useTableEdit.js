/**
 * useTableEdit - Inline cell editing state management for table view.
 * Handles cell selection, value changes, and API persistence.
 */
import { useState, useCallback } from 'react';
import { updateEvent } from '../../../api/eventApi';
import { useCalendarDispatch } from '../../../context/CalendarContext';

function buildUpdatedEvent(event, field, value, tags) {
    const updated = { ...event };
    if (field === 'title') updated.title = value;
    if (field === 'location') updated.location = value;
    if (field === 'description') updated.description = value;
    if (field === 'tag') applyTagUpdate(updated, value, tags);
    return updated;
}

function applyTagUpdate(updated, value, tags) {
    updated.tag = value || null;
    updated.tag_id = value || null;
    const tagObj = tags.find(t => t.id === value || t.id === Number(value));
    updated.tag_name = tagObj?.label || null;
}

async function persistEventUpdate(updatedEvent, dispatch) {
    await updateEvent(updatedEvent.id, updatedEvent);
    dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
}

function useEditState() {
    const [editingCell, setEditingCell] = useState(null);
    const [cellValue, setCellValue] = useState('');
    const [originalValue, setOriginalValue] = useState('');
    return { editingCell, setEditingCell, cellValue, setCellValue, originalValue, setOriginalValue };
}

function createStartEdit(setEditingCell, setCellValue, setOriginalValue) {
    return (eventId, field, value) => {
        setEditingCell({ eventId, field });
        setCellValue(value ?? '');
        setOriginalValue(value ?? '');
    };
}

function createCancelEdit(setEditingCell, setCellValue, setOriginalValue) {
    return () => { setEditingCell(null); setCellValue(''); setOriginalValue(''); };
}

function createSaveEdit(state, events, tags, dispatch, cancelEdit) {
    return async () => {
        if (!state.editingCell || state.cellValue === state.originalValue) { cancelEdit(); return; }
        const event = events.find(e => e.id === state.editingCell.eventId);
        if (!event) { cancelEdit(); return; }
        await persistEventUpdate(buildUpdatedEvent(event, state.editingCell.field, state.cellValue, tags), dispatch);
        cancelEdit();
    };
}

function createSaveWithValue(state, events, tags, dispatch, cancelEdit) {
    return async (value) => {
        if (!state.editingCell || value === state.originalValue) { cancelEdit(); return; }
        const event = events.find(e => e.id === state.editingCell.eventId);
        if (!event) { cancelEdit(); return; }
        await persistEventUpdate(buildUpdatedEvent(event, state.editingCell.field, value, tags), dispatch);
        cancelEdit();
    };
}

function createSaveDateTimes(events, dispatch) {
    return async (eventId, times) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        const updated = { ...event, start_time: times.start_time, end_time: times.end_time };
        await persistEventUpdate(updated, dispatch);
    };
}

/** Hook for managing inline table cell editing with auto-save. */
export function useTableEdit(events, tags = []) {
    const dispatch = useCalendarDispatch();
    const state = useEditState();
    const cancelEdit = useCallback(createCancelEdit(state.setEditingCell, state.setCellValue, state.setOriginalValue), []);
    const startEdit = useCallback(createStartEdit(state.setEditingCell, state.setCellValue, state.setOriginalValue), []);
    const updateValue = useCallback((value) => state.setCellValue(value), []);
    const saveEdit = useCallback(createSaveEdit(state, events, tags, dispatch, cancelEdit), [state.editingCell, state.cellValue, state.originalValue, events, tags, dispatch, cancelEdit]);
    const saveWithValue = useCallback(createSaveWithValue(state, events, tags, dispatch, cancelEdit), [state.editingCell, state.originalValue, events, tags, dispatch, cancelEdit]);
    const saveDateTimes = useCallback(createSaveDateTimes(events, dispatch), [events, dispatch]);
    return { editingCell: state.editingCell, cellValue: state.cellValue, startEdit, updateValue, saveEdit, saveWithValue, saveDateTimes, cancelEdit };
}
