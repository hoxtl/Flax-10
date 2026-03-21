import { useCallback } from "react";
import { useDrop } from './useDragDrop';
import { useCalendar } from "../../../context/CalendarContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { useEventActions } from "./useCalendarEvents";
<<<<<<< HEAD
import { hasRecurrence, isReadOnlyEvent } from "../utils/eventUtils";
import { applyCalculatedEventMove, handleRecurringMoveChoice, moveSingleOccurrenceToWindow } from "./eventMoveUtils";
=======
import { checkOverlapWithConfirm } from "../utils/overlapUtils";
import { extractBaseEventId, hasRecurrence, isReadOnlyEvent } from "../utils/eventUtils";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
    if (isReadOnlyEvent(event)) return;
    if (hasRecurrence(event)) {
        await handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents, confirmFn);
    } else {
        await executeMove(event, targetDate, editEvent, allEvents, confirmFn);
    }
}

async function handleRecurringMove(event, targetDate, editEvent, addEvent, addException, allEvents, confirmFn) {
    await handleRecurringMoveChoice(
        confirmFn,
        () => executeMove(event, targetDate, editEvent, allEvents, confirmFn),
        () => moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents, confirmFn),
    );
}

async function executeMove(event, targetDate, editEvent, allEvents, confirmFn) {
    const createWindow = (currentEvent) => calculateNewTimes(currentEvent, targetDate);
    await applyCalculatedEventMove(event, createWindow, editEvent, allEvents, confirmFn);
}

async function moveSingleOccurrence(event, targetDate, addEvent, addException, allEvents, confirmFn) {
    await moveSingleOccurrenceToWindow(
        event,
        (currentEvent) => calculateNewTimes(currentEvent, targetDate),
        addEvent,
        addException,
        allEvents,
        confirmFn,
    );
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
