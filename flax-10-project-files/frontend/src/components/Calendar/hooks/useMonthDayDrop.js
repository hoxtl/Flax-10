import { useCallback } from "react";
import { useDrop } from './useDragDrop';
import { useCalendar } from "../../../context/CalendarContext";
import { useEventActions } from "./useCalendarEvents";
import { checkOverlapWithConfirm } from "../utils/overlapUtils";
import { extractBaseEventId, hasRecurrence } from "../utils/eventUtils";

export function useMonthDayDrop(targetDate) {
    const { events } = useCalendar();
    const { editEvent, addEvent, addException } = useEventActions();

    const handleDrop = useCallback((payload) => {
        if (payload.type === 'EVENT') {
            moveEventToDate(payload.data, targetDate, editEvent, addEvent, addException, events);
        }
    }, [targetDate, editEvent, addEvent, addException, events]);

    const { dropProps, isOver } = useDrop({ accept: ['EVENT'], onDrop: handleDrop });
    return { dropProps, isOver };
}

function moveEventToDate(event, targetDate, editEvent, addEvent, addException, allEvents) {
    if (hasRecurrence(event)) {
        handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents);
    } else {
        executeMove(event, targetDate, editEvent, allEvents);
    }
}

function handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents) {
    const choice = window.confirm(
        'This is a recurring event.\\n\\nOK = Move ALL occurrences to new date\\nCancel = Move only this occurrence'
    );
    if (choice) {
        executeMove(event, targetDate, editEvent, allEvents);
    } else {
        moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents);
    }
}

function executeMove(event, targetDate, editEvent, allEvents) {
    const { newStart, newEnd } = calculateNewTimes(event, targetDate);
    const baseEventId = extractBaseEventId(event.id);
    const updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
    const others = allEvents.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!checkOverlapWithConfirm({ ...event, ...updateData }, others)) return;
    editEvent(baseEventId, updateData);
}

async function moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents) {
    const { newStart, newEnd } = calculateNewTimes(event, targetDate);
    const newEvent = buildNewEvent(event, newStart, newEnd);
    if (!checkOverlapWithConfirm(newEvent, allEvents)) return;

    const baseEventId = extractBaseEventId(event.id);
    const originalDateStr = getDateString(event.start_time);
    await addException(baseEventId, originalDateStr);
    await addEvent(newEvent);
}

function calculateNewTimes(event, targetDate) {
    const originalStart = new Date(event.start_time);
    const duration = new Date(event.end_time) - originalStart;
    const newStart = createDateWithTime(targetDate, originalStart);
    const newEnd = new Date(newStart.getTime() + duration);
    return { newStart, newEnd };
}

function createDateWithTime(targetDate, sourceTime) {
    const result = new Date(targetDate);
    result.setHours(sourceTime.getHours(), sourceTime.getMinutes(), sourceTime.getSeconds(), 0);
    return result;
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
