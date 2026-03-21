import { useState, useCallback } from "react";
import { useDrop } from './useDragDrop';
import { useCalendar, useEventModal } from "../../../context/CalendarContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { useEventActions } from "./useCalendarEvents";
import { getMinuteOffset, SLOT_HEIGHT } from "../calendarConstants";
import { checkOverlapWithConfirm } from "../utils/overlapUtils";
<<<<<<< HEAD
import { hasRecurrence, isReadOnlyEvent } from "../utils/eventUtils";
import { applyCalculatedEventMove, applyEventMoveWindow, handleRecurringMoveChoice, moveSingleOccurrenceToWindow } from "./eventMoveUtils";
=======
import { extractBaseEventId, hasRecurrence, isReadOnlyEvent } from "../utils/eventUtils";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function useTimeSlotDrop(hour, date) {
    const { events } = useCalendar();
    const { openModal } = useEventModal();
    const confirmFn = useConfirm();
    const actions = useEventActions();
    const [highlightQuarter, setHi] = useState(null);
    const onDrop = useCallback((p, e) => onDropAction(p, e, hour, date, actions, events, setHi, confirmFn), [hour, date, actions, events, confirmFn]);
    const onClick = useCallback((e) => onClickAction(e, hour, date, openModal), [hour, date, openModal]);
    const { dropProps, isOver } = useDrop({ accept: ['TAG', 'EVENT'], onDrop: onDrop });
    return { mergedProps: buildMergedProps(dropProps, isOver, setHi, onClick), isOver, highlightQuarter: highlightQuarter };
}

async function onDropAction(payload, e, hour, date, actions, events, setHighlight, confirmFn) {
    setHighlight(null);
    await dispatchDrop(payload, date, getDropMinutes(hour, e), actions.addEvent, actions.editEvent, actions.addException, events, confirmFn);
}

function onClickAction(e, hour, date, openModal) {
    openEventModalAtTime(date, getClickMinutes(hour, e), openModal);
}

function getDropMinutes(hour, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const minuteOffset = getMinuteOffset(e.clientY, rect.top);
    return hour * 60 + minuteOffset;
}

async function dispatchDrop(payload, date, minutes, addEvent, editEvent, addException, allEvents, confirmFn) {
    if (payload.type === 'TAG') {
        await createEventFromTag(payload.data, date, minutes, addEvent, allEvents, confirmFn);
    } else if (payload.type === 'EVENT') {
        await moveEventToTime(payload.data, date, minutes, addEvent, editEvent, addException, allEvents, confirmFn);
    }
}

function buildMergedProps(dropProps, isOver, setHighlightQuarter, handleClick) {
    return {
        ...dropProps,
        onClick: handleClick,
        onDragOver: createDragOverHandler(dropProps, setHighlightQuarter),
        onDragLeave: createDragLeaveHandler(dropProps, setHighlightQuarter)
    };
}

function createDragOverHandler(dropProps, setHighlightQuarter) {
    return (e) => {
        if (dropProps.onDragOver) dropProps.onDragOver(e);
        const rect = e.currentTarget.getBoundingClientRect();
        const quarter = Math.floor((e.clientY - rect.top) / (SLOT_HEIGHT / 4));
        setHighlightQuarter(Math.min(3, Math.max(0, quarter)));
    };
}

function createDragLeaveHandler(dropProps, setHighlightQuarter) {
    return (e) => {
        if (dropProps.onDragLeave) dropProps.onDragLeave(e);
        setHighlightQuarter(null);
    };
}

function getClickMinutes(hour, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const minuteOffset = getMinuteOffset(e.clientY, rect.top);
    return hour * 60 + minuteOffset;
}

function openEventModalAtTime(date, startMinutes, openModal) {
    const hourStart = Math.floor(startMinutes / 60) * 60;
    const start = createDateAtMinutes(date, hourStart);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 60);
    openModal({ start_time: start, end_time: end });
}

async function createEventFromTag(tag, date, startMinutes, addEvent, allEvents, confirmFn) {
    const start = createDateAtMinutes(date, startMinutes);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (tag.default_duration || 60));
    const newEvent = {
        title: tag.name,
        description: "",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
    };
    if (!(await checkOverlapWithConfirm(newEvent, allEvents, confirmFn))) return;
    await addEvent(newEvent);
}

async function moveEventToTime(event, date, startMinutes, addEvent, editEvent, addException, allEvents, confirmFn) {
    if (isReadOnlyEvent(event)) return;
    if (hasRecurrence(event)) {
        await handleRecurringMove(event, date, startMinutes, addEvent, editEvent, addException, allEvents, confirmFn);
    } else {
        await executeMove(event, date, startMinutes, editEvent, allEvents, confirmFn);
    }
}

async function handleRecurringMove(event, date, startMinutes, addEvent, editEvent, addException, allEvents, confirmFn) {
    await handleRecurringMoveChoice(
        confirmFn,
        () => updateAllOccurrences(event, startMinutes, editEvent, allEvents, confirmFn),
        () => moveSingleOccurrence(event, date, startMinutes, addEvent, addException, allEvents, confirmFn),
    );
}

async function updateAllOccurrences(event, startMinutes, editEvent, allEvents, confirmFn) {
    const originalStart = new Date(event.start_time);
    const newStart = new Date(originalStart);
    newStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const duration = new Date(event.end_time) - originalStart;
    const newEnd = new Date(newStart.getTime() + duration);
    await applyEventMoveWindow(event, newStart, newEnd, editEvent, allEvents, confirmFn);
}

async function moveSingleOccurrence(event, date, startMinutes, addEvent, addException, allEvents, confirmFn) {
    await moveSingleOccurrenceToWindow(
        event,
        (currentEvent) => calculateNewTimes(currentEvent, date, startMinutes),
        addEvent,
        addException,
        allEvents,
        confirmFn,
    );
}

async function executeMove(event, date, startMinutes, editEvent, allEvents, confirmFn) {
    await applyCalculatedEventMove(
        event,
        (currentEvent) => calculateNewTimes(currentEvent, date, startMinutes),
        editEvent,
        allEvents,
        confirmFn,
    );
}

function calculateNewTimes(event, date, startMinutes) {
    const duration = new Date(event.end_time) - new Date(event.start_time);
    const newStart = createDateAtMinutes(date, startMinutes);
    const newEnd = new Date(newStart.getTime() + duration);
    return { newStart, newEnd };
}

function createDateAtMinutes(date, totalMinutes) {
    const result = new Date(date);
    result.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return result;
}
