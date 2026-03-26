<<<<<<< HEAD
/*
 * useTableEdit.js
 * Inline editing state and persistence for the calendar table view.
 */

import { useCallback, useState } from "react";
import { updateEvent } from "../../../api/eventApi";
import { geocodeAddress } from "../../../api/geocodeApi";
import { useCalendarDispatch } from "../../../context/CalendarContext";

function applyFieldUpdate(event, field, value, tags) {
  if (field === "location") return applyLocationUpdate(event, value);
  if (field === "tag") return Promise.resolve(applyTagUpdate(event, value, tags));
  return Promise.resolve({ ...event, [field]: value });
}

async function applyLocationUpdate(event, value) {
  const updated = { ...event, location: value };
  if (!value?.trim()) return clearLocation(updated);
  const coords = await geocodeLocation(value);
  return applyCoordinates(updated, coords);
}

async function geocodeLocation(value) {
  try {
    return await geocodeAddress(value);
  } catch {
    return null;
  }
}

function clearLocation(event) {
  return {
    ...event,
    location_latitude: null,
    location_longitude: null,
    location_validated: false,
  };
}

function applyCoordinates(event, coords) {
  if (!coords) return { ...event, location_validated: false };
  return {
    ...event,
    location_latitude: coords.latitude,
    location_longitude: coords.longitude,
    location_validated: true,
  };
}

function applyTagUpdate(event, value, tags) {
  const tag = tags.find(({ id }) => id === value || id === Number(value));
  return { ...event, tag: value || null, tag_id: value || null, tag_name: tag?.label || null };
}

async function persistEventUpdate(updatedEvent, dispatch) {
  await updateEvent(updatedEvent.id, updatedEvent);
  dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });
}

function useEditState() {
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  return { editingCell, cellValue, originalValue, setEditingCell, setCellValue, setOriginalValue };
}

function useTableEditActions(state, events, tags, dispatch) {
  return {
    cancelEdit: useCallback(() => resetEditState(state), [state]),
    saveDateTimes: useCallback((eventId, times) => saveDateTimes(events, dispatch, eventId, times), [dispatch, events]),
    saveEdit: useCallback(() => saveEditValue(state, events, tags, dispatch, state.cellValue), [dispatch, events, state, tags]),
    saveWithValue: useCallback((value) => saveEditValue(state, events, tags, dispatch, value), [dispatch, events, state, tags]),
    startEdit: useCallback((...args) => startEdit(state, ...args), [state]),
    updateValue: useCallback((value) => state.setCellValue(value), [state]),
  };
}

function resetEditState(state) {
  state.setEditingCell(null);
  state.setCellValue("");
  state.setOriginalValue("");
}

function startEdit(state, eventId, field, value) {
  state.setEditingCell({ eventId, field });
  state.setCellValue(value ?? "");
  state.setOriginalValue(value ?? "");
}

function getEditedEvent(events, editingCell) {
  return events.find(({ id }) => id === editingCell?.eventId);
}

async function saveEditValue(state, events, tags, dispatch, value) {
  if (!state.editingCell || value === state.originalValue) return resetEditState(state);
  const event = getEditedEvent(events, state.editingCell);
  if (!event) return resetEditState(state);
  const updatedEvent = await applyFieldUpdate(event, state.editingCell.field, value, tags);
  await persistEventUpdate(updatedEvent, dispatch);
  resetEditState(state);
}

async function saveDateTimes(events, dispatch, eventId, times) {
  const event = events.find(({ id }) => id === eventId);
  if (!event) return;
  await persistEventUpdate({ ...event, ...times }, dispatch);
}

export function useTableEdit(events, tags = []) {
  const dispatch = useCalendarDispatch();
  const state = useEditState();
  const actions = useTableEditActions(state, events, tags, dispatch);
  return { editingCell: state.editingCell, cellValue: state.cellValue, ...actions };
=======
/**
 * useTableEdit - Inline cell editing state management for table view.
 * Handles cell selection, value changes, and API persistence.
 */
import { useState, useCallback } from 'react';
import { updateEvent } from '../../../api/eventApi';
import { useCalendarDispatch } from '../../../context/CalendarContext';
import { geocodeAddress } from '../../../api/userApi';

async function buildUpdatedEvent(event, field, value, tags) {
    const updated = {...event };
    if (field === 'title') updated.title = value;
    if (field === 'location') {
        updated.location = value;
        if (value && value.trim()) {
            try {
                const coords = await geocodeAddress(value);
                if (coords) {
                    updated.location_latitude = coords.latitude;
                    updated.location_longitude = coords.longitude;
                    updated.location_validated = true;
                } else {
                    updated.location_validated = false;
                }
            } catch (error) {
                console.error('Table edit geocoding failed: ', error);
                updated.location_validated = false;
            }
        } else {
            updated.location_latitude = null;
            updated.location_longitude = null;
            updated.location_validated = false;
        }
    }
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
        const updatedEvent = await buildUpdatedEvent(event, state.editingCell.field, state.cellValue, tags);
        await persistEventUpdate(updatedEvent, dispatch);
        cancelEdit();
    };
}

function createSaveWithValue(state, events, tags, dispatch, cancelEdit) {
    return async (value) => {
        if (!state.editingCell || value === state.originalValue) { cancelEdit(); return; }
        const event = events.find(e => e.id === state.editingCell.eventId);
        if (!event) { cancelEdit(); return; }
        const updatedEvent = await buildUpdatedEvent(event, state.editingCell.field, value, tags);
        await persistEventUpdate(updatedEvent, dispatch);
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
