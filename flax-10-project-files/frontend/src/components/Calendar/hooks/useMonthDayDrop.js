import { useCallback } from "react";
import { useDrop } from './useDragDrop';
import { useCalendar } from "../../../context/CalendarContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { useEventActions } from "./useCalendarEvents";
import { checkOverlapWithConfirm } from "../utils/overlapUtils";
import { extractBaseEventId, hasRecurrence } from "../utils/eventUtils";

export function useMonthDayDrop(targetDate) {
    const { events } = useCalendar();
    const confirmFn = useConfirm();
    const { editEvent, addEvent, addException } = useEventActions();

    const handleDrop = useCallback(async (payload) => {
        if (payload.type === 'EVENT') {
            await moveEventToDate(payload.data, targetDate, editEvent, addEvent, addException, events, confirmFn);
        }
    }, [targetDate, editEvent, addEvent, addException, events, confirmFn]);

    const { dropProps, isOver } = useDrop({ accept: ['EVENT'], onDrop: handleDrop });
    return { dropProps, isOver };
}

async function moveEventToDate(event, targetDate, editEvent, addEvent, addException, allEvents, confirmFn) {
    if (hasRecurrence(event)) {
        await handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents, confirmFn);
    } else {
        await executeMove(event, targetDate, editEvent, allEvents, confirmFn);
    }
}

async function handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents, confirmFn) {
    const choice = await confirmFn({
        title: "Recurring Event",
        message: "This is a recurring event. How would you like to move it?",
        confirmText: "Move ALL",
        cancelText: "Move ONLY this"
    });
    if (choice) {
        await executeMove(event, targetDate, editEvent, allEvents, confirmFn);
    } else {
        await moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents, confirmFn);
    }
}

async function executeMove(event, targetDate, editEvent, allEvents, confirmFn) {
    const { newStart, newEnd } = calculateNewTimes(event, targetDate);
    const baseEventId = extractBaseEventId(event.id);
    const updateData = { start_time: newStart.toISOString(), end_time: newEnd.toISOString() };
    const others = allEvents.filter(e => extractBaseEventId(e.id) !== baseEventId);
    if (!(await checkOverlapWithConfirm({ ...event, ...updateData }, others, confirmFn))) return;
    editEvent(baseEventId, updateData);
}

async function moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents, confirmFn) {
    const { newStart, newEnd } = calculateNewTimes(event, targetDate);
    const newEvent = buildNewEvent(event, newStart, newEnd);
    if (!(await checkOverlapWithConfirm(newEvent, allEvents, confirmFn))) return;

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
