/*
 * Shared helpers for drag-moving calendar events.
 */

import { checkOverlapWithConfirm } from "../utils/overlapUtils";
import { extractBaseEventId } from "../utils/eventUtils";

export async function confirmRecurringMove(confirmFn) {
  return confirmFn({
    title: "Recurring Event",
    message: "This is a recurring event. How would you like to move it?",
    confirmText: "Move ALL",
    cancelText: "Move ONLY this",
  });
}

export function buildMovedEvent(event, newStart, newEnd) {
  return {
    title: event.title,
    description: event.description || "",
    start_time: newStart.toISOString(),
    end_time: newEnd.toISOString(),
    location: event.location || "",
  };
}

export function getOccurrenceDateString(dateTime) {
  return new Date(dateTime).toISOString().slice(0, 10);
}

export async function applyMovedEvent(event, updateData, editEvent, allEvents, confirmFn) {
  const baseEventId = extractBaseEventId(event.id);
  const others = allEvents.filter((item) => extractBaseEventId(item.id) !== baseEventId);
  if (!(await checkOverlapWithConfirm({ ...event, ...updateData }, others, confirmFn))) return false;
  await editEvent(baseEventId, updateData);
  return true;
}

export async function applyEventMoveWindow(event, newStart, newEnd, editEvent, allEvents, confirmFn) {
  return applyMovedEvent(
    event,
    { start_time: newStart.toISOString(), end_time: newEnd.toISOString() },
    editEvent,
    allEvents,
    confirmFn,
  );
}

export async function applyCalculatedEventMove(event, createWindow, editEvent, allEvents, confirmFn) {
  const { newStart, newEnd } = createWindow(event);
  return applyEventMoveWindow(event, newStart, newEnd, editEvent, allEvents, confirmFn);
}

export async function handleRecurringMoveChoice(confirmFn, moveAll, moveSingle) {
  const choice = await confirmRecurringMove(confirmFn);
  if (choice) {
    return moveAll();
  }

  return moveSingle();
}

export async function moveSingleOccurrenceToWindow(event, createWindow, addEvent, addException, allEvents, confirmFn) {
  const { newStart, newEnd } = createWindow(event);
  const newEvent = buildMovedEvent(event, newStart, newEnd);
  if (!(await checkOverlapWithConfirm(newEvent, allEvents, confirmFn))) return false;

  const baseEventId = extractBaseEventId(event.id);
  const originalDateStr = getOccurrenceDateString(event.start_time);
  await addException(baseEventId, originalDateStr);
  await addEvent(newEvent);
  return true;
}
