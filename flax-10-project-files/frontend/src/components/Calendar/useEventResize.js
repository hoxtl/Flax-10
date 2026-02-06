import { useState, useCallback } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useResizeHighlight } from '../../context/ResizeHighlightContext';
import { createResizeSession } from '../../utils/resizeUtils';
import { SLOT_HEIGHT, MIN_EVENT_DURATION, pixelsToMinutes, SNAP_INTERVAL } from './calendarConstants';
import { checkOverlapWithConfirm } from '../../utils/overlapUtils';

export function useEventResize(event, eventRef, editEvent, resizeJustEnded, isRecurringInstance = false) {
    const { events } = useCalendar();
    const { setResizeHighlight } = useResizeHighlight();
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null);
    const handleResizeStart = useCallback((e) => {
        if (isRecurringInstance) return;
        e.stopPropagation();
        setIsResizing(true);
        const onMove = createMoveHandler(event, setResizePreview, setResizeHighlight);
        const onEnd = createEndHandler(event, editEvent, events, setIsResizing, setResizePreview, setResizeHighlight, resizeJustEnded);
        createResizeSession(e.clientY, eventRef.current.offsetHeight, { onMove, onEnd });
    }, [event, eventRef, editEvent, resizeJustEnded, events, setResizeHighlight, isRecurringInstance]);
    return { isResizing, resizePreview, handleResizeStart };
}

function createMoveHandler(event, setResizePreview, setResizeHighlight) {
    return (height) => {
        const snappedHeight = snapHeightToGrid(event, height);
        setResizePreview(snappedHeight);
        updateHighlight(event, height, setResizeHighlight);
    };
}

function createEndHandler(event, editEvent, events, setIsResizing, setResizePreview, setResizeHighlight, resizeJustEnded) {
    return (diff) => {
        saveResizedEvent(event, diff, editEvent, events, resizeJustEnded);
        setIsResizing(false);
        setResizePreview(null);
        setResizeHighlight(null);
    };
}

function snapHeightToGrid(event, rawHeight) {
    const start = new Date(event.start_time);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const endMins = startMins + (rawHeight / SLOT_HEIGHT) * 60;
    const snappedEndMins = Math.round(endMins / SNAP_INTERVAL) * SNAP_INTERVAL;
    const duration = snappedEndMins - startMins;
    return (duration / 60) * SLOT_HEIGHT;
}

function updateHighlight(event, newHeight, setResizeHighlight) {
    const start = new Date(event.start_time);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const endMins = startMins + (newHeight / SLOT_HEIGHT) * 60;
    const snappedEndMins = Math.round(endMins / SNAP_INTERVAL) * SNAP_INTERVAL;
    const hour = Math.floor(snappedEndMins / 60);
    const quarter = Math.floor((snappedEndMins % 60) / SNAP_INTERVAL);
    setResizeHighlight({ date: start, hour, quarter });
}

/**
 * Calculates the preview height during resize.
 * Enforces minimum height based on MIN_EVENT_DURATION.
 */
function calculateNewHeight(originalHeight, currentY, startY) {
    const delta = currentY - startY;
    const minHeight = (MIN_EVENT_DURATION / 60) * SLOT_HEIGHT;
    return Math.max(minHeight, originalHeight + delta);
}

function saveResizedEvent(event, deltaY, editEvent, events, resizeJustEnded) {
    const newEnd = calculateNewEndTime(event, deltaY);
    const baseEventId = extractBaseEventId(event.id);
    const updatedEvent = { ...event, end_time: newEnd.toISOString() };
    const others = events.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (checkOverlapWithConfirm(updatedEvent, others)) {
        editEvent(baseEventId, { end_time: newEnd.toISOString() });
        if (resizeJustEnded) resizeJustEnded.current = true;
    }
}

function extractBaseEventId(id) {
    return id > 1000000 ? Math.floor(id / 1000000) : id;
}

function calculateNewEndTime(event, deltaY) {
    const start = new Date(event.start_time);
    const startMins = start.getHours() * 60 + start.getMinutes();
    const currentDuration = (new Date(event.end_time) - start) / (1000 * 60);
    const newDuration = currentDuration + pixelsToMinutes(deltaY);
    const snappedEndMins = Math.round((startMins + newDuration) / SNAP_INTERVAL) * SNAP_INTERVAL;
    const newEnd = new Date(start);
    newEnd.setHours(Math.floor(snappedEndMins / 60), snappedEndMins % 60, 0, 0);
    return newEnd;
}

function isValidResize(event, newEnd, otherEvents) {
    const start = new Date(event.start_time);
    if (newEnd <= start) return false;
    return checkOverlapWithConfirm({ ...event, end_time: newEnd.toISOString() }, otherEvents);
}