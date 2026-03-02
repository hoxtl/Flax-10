import { useState, useCallback } from 'react';
import { useCalendar } from '../../../context/CalendarContext';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { createResizeSession } from '../utils/resizeUtils';
import { SLOT_HEIGHT, MIN_EVENT_DURATION, pixelsToMinutes, SLOT_INTERVAL_MINUTES, SNAP_INTERVAL } from '../calendarConstants';
import { checkOverlapWithConfirm } from '../utils/overlapUtils';
import { extractBaseEventId, hasRecurrence } from '../utils/eventUtils';

export function useEventResize(event, eventRef, editEvent, resizeJustEnded) {
    const { events } = useCalendar();
    const { setResizeHighlight } = useResizeHighlight();
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null);
    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        setIsResizing(true);
        const onMove = createMoveHandler(event, setResizePreview, setResizeHighlight);
        const onEnd = createEndHandler(event, editEvent, events, setIsResizing, setResizePreview, setResizeHighlight, resizeJustEnded);
        createResizeSession(e.clientY, eventRef.current.offsetHeight, { onMove, onEnd });
    }, [event, eventRef, editEvent, resizeJustEnded, events, setResizeHighlight]);
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
    const slotStartMinutes = Math.floor(snappedEndMins / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
    const segment = Math.floor((snappedEndMins - slotStartMinutes) / SNAP_INTERVAL);
    setResizeHighlight({ date: start, slotStartMinutes, segment });
}



function saveResizedEvent(event, deltaY, editEvent, events, resizeJustEnded) {
    const isRecurring = hasRecurrence(event);
    if (isRecurring) {
        handleRecurringResize(event, deltaY, editEvent, events, resizeJustEnded);
    } else {
        executeResize(event, deltaY, editEvent, events, resizeJustEnded);
    }
}

function handleRecurringResize(event, deltaY, editEvent, events, resizeJustEnded) {
    const choice = window.confirm(
        'This is a recurring event.\n\nOK = Resize ALL occurrences\nCancel = Cancel resize'
    );
    if (choice) {
        executeResize(event, deltaY, editEvent, events, resizeJustEnded);
    }
}

function executeResize(event, deltaY, editEvent, events, resizeJustEnded) {
    const newEnd = calculateNewEndTime(event, deltaY);
    const baseEventId = extractBaseEventId(event.id);
    const updatedEvent = { ...event, end_time: newEnd.toISOString() };
    const others = events.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!checkOverlapWithConfirm(updatedEvent, others)) return;
    editEvent(baseEventId, { end_time: newEnd.toISOString() });
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
