/**
 * useEventResize - Event duration resizing via drag handle.
 * Handles grid snapping, overlap checking, and recurring event confirmation.
 */

import { useState, useCallback } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { createResizeSession } from '../utils/resizeUtils';
import { SLOT_HEIGHT, MIN_EVENT_DURATION, pixelsToMinutes, SNAP_INTERVAL } from '../calendarConstants';
import { checkOverlapWithConfirm } from '../utils/overlapUtils';
import { extractBaseEventId, hasRecurrence } from '../utils/eventUtils';

/** Hook for resizing event duration by dragging the bottom handle. */

export function useEventResize(event, eventRef, editEvent, resizeJustEnded) {
    const { events } = useCalendar();
    const confirmFn = useConfirm();
    const { setResizeHighlight } = useResizeHighlight();
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null);
    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        setIsResizing(true);
        const onMove = createMoveHandler(event, setResizePreview, setResizeHighlight);
        const onEnd = createEndHandler(event, editEvent, events, setIsResizing, setResizePreview, setResizeHighlight, resizeJustEnded, confirmFn);
        createResizeSession(e.clientY, eventRef.current.offsetHeight, { onMove, onEnd });
    }, [event, eventRef, editEvent, resizeJustEnded, events, setResizeHighlight, confirmFn]);
    return { isResizing, resizePreview, handleResizeStart };
}

function createMoveHandler(event, setResizePreview, setResizeHighlight) {
    return (height) => {
        const snappedHeight = snapHeightToGrid(event, height);
        setResizePreview(snappedHeight);
        updateHighlight(event, height, setResizeHighlight);
    };
}

function createEndHandler(event, editEvent, events, setIsResizing, setResizePreview, setResizeHighlight, resizeJustEnded, confirmFn) {
    return async (diff) => {
        await saveResizedEvent(event, diff, editEvent, events, resizeJustEnded, confirmFn);
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



async function saveResizedEvent(event, deltaY, editEvent, events, resizeJustEnded, confirmFn) {
    const isRecurring = hasRecurrence(event);
    if (isRecurring) {
        await handleRecurringResize(event, deltaY, editEvent, events, resizeJustEnded, confirmFn);
    } else {
        await executeResize(event, deltaY, editEvent, events, resizeJustEnded, confirmFn);
    }
}

async function handleRecurringResize(event, deltaY, editEvent, events, resizeJustEnded, confirmFn) {
    const choice = await confirmFn({
        title: "Recurring Event",
        message: "This is a recurring event. How would you like to resize it?",
        confirmText: "Resize ALL occurrences",
        cancelText: "Cancel resize",
        isDanger: false
    });
    if (choice) {
        await executeResize(event, deltaY, editEvent, events, resizeJustEnded, confirmFn);
    }
}

async function executeResize(event, deltaY, editEvent, events, resizeJustEnded, confirmFn) {
    const newEnd = calculateNewEndTime(event, deltaY);
    const baseEventId = extractBaseEventId(event.id);
    const updatedEvent = { ...event, end_time: newEnd.toISOString() };
    const others = events.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!(await checkOverlapWithConfirm(updatedEvent, others, confirmFn))) return;
    await editEvent(baseEventId, { end_time: newEnd.toISOString() });
    markResizeEnded(resizeJustEnded);
}

function markResizeEnded(resizeJustEnded) {
    if (resizeJustEnded) resizeJustEnded.current = true;
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
