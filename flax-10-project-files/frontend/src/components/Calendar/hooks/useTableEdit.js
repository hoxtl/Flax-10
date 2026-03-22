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
  } catch (error) {
    console.error("Table edit geocoding failed:", error);
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
}
