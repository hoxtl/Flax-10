import { useState, useCallback } from "react";
import { useDrop } from './useDragDrop';
import { useCalendar, useEventModal } from "../../../context/CalendarContext";
import { useEventActions } from "./useCalendarEvents";
import { getMinuteOffset, SLOT_HEIGHT } from "../calendarConstants";
import { checkOverlapWithConfirm } from "../utils/overlapUtils";
import { extractBaseEventId, hasRecurrence } from "../utils/eventUtils";

export function useTimeSlotDrop(hour, date) {
    const { events } = useCalendar();
    const { openModal } = useEventModal();
    const actions = useEventActions();
    const [highlightQuarter, setHi] = useState(null);
    const onDrop = useCallback((p, e) => onDropAction(p, e, hour, date, actions, events, setHi), [hour, date, actions, events]);
    const onClick = useCallback((e) => onClickAction(e, hour, date, openModal), [hour, date, openModal]);
    const { dropProps, isOver } = useDrop({ accept: ['TAG', 'EVENT'], onDrop: onDrop });
    return { mergedProps: buildMergedProps(dropProps, isOver, setHi, onClick), isOver, highlightQuarter: highlightQuarter };
}

function onDropAction(payload, e, hour, date, actions, events, setHighlight) {
    setHighlight(null);
    dispatchDrop(payload, date, getDropMinutes(hour, e), actions.addEvent, actions.editEvent, actions.addException, events);
}

function onClickAction(e, hour, date, openModal) {
    openEventModalAtTime(date, getClickMinutes(hour, e), openModal);
}

function getDropMinutes(hour, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const minuteOffset = getMinuteOffset(e.clientY, rect.top);
    return hour * 60 + minuteOffset;
}

function dispatchDrop(payload, date, minutes, addEvent, editEvent, addException, allEvents) {
    if (payload.type === 'TAG') {
        createEventFromTag(payload.data, date, minutes, addEvent, allEvents);
    } else if (payload.type === 'EVENT') {
        moveEventToTime(payload.data, date, minutes, addEvent, editEvent, addException, allEvents);
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

function createEventFromTag(tag, date, startMinutes, addEvent, allEvents) {
    const start = createDateAtMinutes(date, startMinutes);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (tag.default_duration || 60));
    const newEvent = {
        title: tag.name,
        description: "",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
    };
    if (!checkOverlapWithConfirm(newEvent, allEvents)) return;
    addEvent(newEvent);
}

function moveEventToTime(event, date, startMinutes, addEvent, editEvent, addException, allEvents) {
    if (hasRecurrence(event)) {
        handleRecurringMove(event, date, startMinutes, addEvent, editEvent, addException, allEvents);
    } else {
        executeMove(event, date, startMinutes, editEvent, allEvents);
    }
}

function handleRecurringMove(event, date, startMinutes, addEvent, editEvent, addException, allEvents) {
    const choice = window.confirm(
        'This is a recurring event.\n\nOK = Change time for ALL occurrences\nCancel = Move only this occurrence'
    );
    if (choice) {
        updateAllOccurrences(event, startMinutes, editEvent, allEvents);
    } else {
        moveSingleOccurrence(event, date, startMinutes, addEvent, addException, allEvents);
    }
}

function updateAllOccurrences(event, startMinutes, editEvent, allEvents) {
    const originalStart = new Date(event.start_time);
    const newStart = new Date(originalStart);
    newStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const duration = new Date(event.end_time) - originalStart;
    const newEnd = new Date(newStart.getTime() + duration);
    const baseEventId = extractBaseEventId(event.id);
    const updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
    const others = allEvents.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!checkOverlapWithConfirm({ ...event, ...updateData }, others)) return;
    editEvent(baseEventId, updateData);
}

async function moveSingleOccurrence(event, date, startMinutes, addEvent, addException, allEvents) {
    const { newStart, newEnd } = calculateNewTimes(event, date, startMinutes);
    const newEvent = buildNewEvent(event, newStart, newEnd);
    if (!checkOverlapWithConfirm(newEvent, allEvents)) return;

    const baseEventId = extractBaseEventId(event.id);
    const originalDateStr = getDateString(event.start_time);
    await addException(baseEventId, originalDateStr);
    await addEvent(newEvent);
}

function buildNewEvent(event, newStart, newEnd) {
    return {
        title: event.title,
        description: event.description || '',
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        location: event.location || '',
    };
}

function getDateString(dateTime) {
    return new Date(dateTime).toISOString().slice(0, 10);
}

function executeMove(event, date, startMinutes, editEvent, allEvents) {
    const { newStart, newEnd } = calculateNewTimes(event, date, startMinutes);
    const baseEventId = extractBaseEventId(event.id);
    const updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
    const others = allEvents.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!checkOverlapWithConfirm({ ...event, ...updateData }, others)) return;
    editEvent(baseEventId, updateData);
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
