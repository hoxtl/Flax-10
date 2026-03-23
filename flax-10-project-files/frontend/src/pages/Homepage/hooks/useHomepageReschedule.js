/**
 * Homepage reschedule actions.
 */

import { useCallback, useState } from "react";
import { formatTime, getAllFreeWindowsToday, getNextFreeSlotToday, isRoutineEvent } from "../utils/index";
import { extractBaseEventId } from "../../../components/Calendar/utils/eventUtils";
import { applyConflictResolutionPlan, buildConflictResolutionPlan, buildConflictResolutionToastMessage, undoConflictResolutionPlan } from "../../../components/Common/RescheduleEvents/rescheduleEventConflicts";

export function useHomepageReschedule(props) {
  const [replanLoading, setReplanLoading] = useState(false);
  const [resolveConflictsLoading, setResolveConflictsLoading] = useState(false);
  return {
    handleConflictAutoMove: useConflictAutoMove(props),
    handleConflictPushTomorrow: useConflictPushTomorrow(props),
    handleQuickStartGap: useQuickStartGap(props),
    handleReplanDay: useReplanDay(props, setReplanLoading),
    handleResolveTimelineConflicts: useResolveTimelineConflicts(props, setResolveConflictsLoading),
    handleReschedule: useReschedule(props),
    handleRescheduleTomorrow: useRescheduleTomorrow(props),
    handleTimelineDelete: useTimelineDelete(props),
    replanLoading,
    resolveConflictsLoading,
  };
}

function useRescheduleTomorrow(props) {
  return useCallback(async (item) => {
    try {
      await props.addEvent(buildTomorrowEvent(item, props.selectedDate));
      await props.removeEvent(extractBaseEventId(item.id));
      await props.loadEvents();
      props.showToast(`"${item.title}" re-scheduled for tomorrow at 9:00`);
    } catch {
      props.showToast("Couldn't re-schedule. Try again.");
    } finally {
      props.refetchTasks();
    }
  }, [props]);
}

function buildTomorrowEvent(item, selectedDate) {
  const { durationMins } = getEventDuration(item);
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return { title: item.title, description: item.description || "", start_time: tomorrow.toISOString(), end_time: new Date(tomorrow.getTime() + durationMins * 60000).toISOString() };
}

function useReschedule(props) {
  const handleTomorrow = useRescheduleTomorrow(props);
  return useCallback(async (item) => {
    const { durationMins } = getEventDuration(item);
    const slot = getNextFreeSlotToday(props.sortedEvents, props.selectedDate, durationMins);
    if (!slot) return handleTomorrow(item);
    await moveIntoSlot(item, slot, props);
  }, [handleTomorrow, props]);
}

async function moveIntoSlot(item, slot, props) {
  const baseId = extractBaseEventId(item.id);
  const optimistic = { ...item, start_time: slot.start.toISOString(), end_time: slot.end.toISOString() };
  props.removeEvent(item.id);
  props.addEvent(optimistic);
  props.showToast(`"${item.title}" → ${formatTime(slot.start.toISOString())}`);
  try {
    await props.editEvent(baseId, { start_time: optimistic.start_time, end_time: optimistic.end_time });
    await props.loadEvents();
  } catch {
    props.removeEvent(item.id);
    props.addEvent(item);
    props.showToast("Couldn't reschedule. Try again.");
  }
}

function useQuickStartGap(props) {
  return useCallback(async (gapStartDate, _gapMins, task) => {
    if (!task) return;
    try {
      await props.addEvent(buildGapEvent(task, gapStartDate));
      await props.loadEvents();
      props.showToast(`"${task.title}" added to schedule at ${formatTime(gapStartDate.toISOString())}`);
    } catch {
      props.showToast("Couldn't add to schedule. Try again.");
    }
  }, [props]);
}

function buildGapEvent(task, gapStartDate) {
  const durationMins = (task.estimated_blocks || 1) * 25;
  return { title: task.title, start_time: gapStartDate.toISOString(), end_time: new Date(gapStartDate.getTime() + durationMins * 60000).toISOString(), description: task.description || "" };
}

function useConflictAutoMove(props) {
  return useCallback(async (event, newStart, newEnd) => {
    try {
      await props.editEvent(extractBaseEventId(event.id), { start_time: newStart.toISOString(), end_time: newEnd.toISOString() });
      await props.loadEvents();
      props.showToast("Event moved to next available window.");
    } catch {
      props.showToast("Couldn't move event. Try again.");
    }
  }, [props]);
}

function useConflictPushTomorrow(props) {
  return useCallback(async (event) => {
    if (!event?.start_time) return;
    try {
      await moveEventToTomorrow(event, props);
    } catch {
      props.showToast("Couldn't move to tomorrow.");
    }
  }, [props]);
}

async function moveEventToTomorrow(event, props) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time || start.getTime() + 25 * 60000);
  const moved = buildMovedEvent(start, end);
  const baseId = extractBaseEventId(event.id);
  await props.editEvent(baseId, moved);
  await props.loadEvents();
  props.showToast(`"${event.title}" moved to tomorrow.`, { actionLabel: "Undo", durationMs: 7000, onAction: async () => undoMovedEvent(baseId, start, end, props) });
}

function buildMovedEvent(start, end) {
  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  const durationMins = Math.max(25, Math.round((end - start) / 60000) || 25);
  return { start_time: nextDay.toISOString(), end_time: new Date(nextDay.getTime() + durationMins * 60000).toISOString() };
}

async function undoMovedEvent(baseId, start, end, props) {
  try {
    await props.editEvent(baseId, { start_time: start.toISOString(), end_time: end.toISOString() });
    await props.loadEvents();
    props.showToast("Undid move.");
  } catch {
    props.showToast("Undo failed.");
  }
}

function useTimelineDelete(props) {
  return useCallback(async (eventLike) => {
    try {
      await deleteTimelineItem(eventLike, props);
    } catch {
      props.showToast("Couldn't delete item.");
    }
  }, [props]);
}

async function deleteTimelineItem(eventLike, props) {
  const eventObj = eventLike && typeof eventLike === "object" ? eventLike : null;
  if (eventObj?.source === "task" && eventObj?.external_id) return deleteTaskEvent(eventObj, props);
  await props.removeEvent(extractBaseEventId(eventObj?.id ?? eventLike, eventObj));
  await props.loadEvents();
  props.showToast(`"${eventObj?.title || "Event"}" deleted.`);
}

async function deleteTaskEvent(eventObj, props) {
  await props.deleteTask(eventObj.external_id);
  await Promise.all([props.loadEvents(), props.refetchTasks()]);
  props.showToast(`"${eventObj.title}" removed.`);
}

function useResolveTimelineConflicts(props, setResolveConflictsLoading) {
  return useCallback(async () => {
    const plan = buildConflictResolutionPlan(props.sortedEvents, props.selectedDate);
    if (!plan.operations.length) {
      props.showToast(buildConflictResolutionToastMessage(plan));
      return;
    }
    setResolveConflictsLoading(true);
    try {
      await applyConflictResolutionPlan(plan, props.editEvent);
      await props.loadEvents?.();
      props.refetchTasks();
      props.showToast(buildConflictResolutionToastMessage(plan), {
        actionLabel: "Undo",
        durationMs: 8500,
        onAction: async () => {
          await undoConflictResolutionPlan(plan, props.editEvent);
          await props.loadEvents?.();
          props.refetchTasks();
          props.showToast("Undid reschedule.");
        },
      });
    } catch {
      props.showToast("Couldn't reschedule your events. Try again.");
    } finally {
      setResolveConflictsLoading(false);
    }
  }, [props, setResolveConflictsLoading]);
}

function useReplanDay(props, setReplanLoading) {
  return useCallback(async () => {
    const plan = createReplanPlan(props);
    if (!plan) return;
    setReplanLoading(true);
    try {
      await executeReplan(plan, props);
    } catch {
      props.showToast("Couldn't re-plan.");
    } finally {
      setReplanLoading(false);
    }
  }, [props, setReplanLoading]);
}

function createReplanPlan(props) {
  const missed = (props.missedItems || []).filter((item) => !isRoutineEvent(item));
  const overdue = props.overdueTasksForNow || [];
  if (!missed.length && !overdue.length) return props.showToast("Nothing to re-plan.");
  const windows = getAllFreeWindowsToday(props.sortedEvents, props.selectedDate);
  if (!windows.length) return props.showToast("No free windows left today.");
  return { missed, overdue, windows: windows.map(copyWindow) };
}

function copyWindow(window) {
  return { start: new Date(window.start), end: new Date(window.end), minutes: window.minutes };
}

async function executeReplan(plan, props) {
  const assigned = { current: 0 };
  await assignItems(plan.missed.sort(sortByStartTime), plan.windows, props.editEvent, assigned);
  await assignTasks(plan.overdue, plan.windows, props.addEvent, assigned);
  await props.loadEvents();
  props.refetchTasks();
  props.showToast(assigned.current > 0 ? `Re-planned ${assigned.current} items.` : "No items fit.");
}

function sortByStartTime(left, right) {
  return new Date(left.start_time) - new Date(right.start_time);
}

async function assignItems(items, windows, editEvent, assigned) {
  for (const item of items) await assignWindowItem(item, windows, editEvent, assigned);
}

async function assignTasks(tasks, windows, addEvent, assigned) {
  for (const task of tasks) await assignWindowTask(task, windows, addEvent, assigned);
}

async function assignWindowItem(item, windows, editEvent, assigned) {
  const { durationMins } = getEventDuration(item);
  const window = windows.find((entry) => entry.minutes >= durationMins);
  if (!window) return;
  const slotStart = new Date(window.start);
  const end = updateWindow(window, durationMins);
  await editEvent(extractBaseEventId(item.id), { start_time: slotStart.toISOString(), end_time: end.toISOString() });
  assigned.current += 1;
}

async function assignWindowTask(task, windows, addEvent, assigned) {
  const durationMins = (task.estimated_blocks || 1) * 25;
  const window = windows.find((entry) => entry.minutes >= durationMins);
  if (!window) return;
  const slotStart = new Date(window.start);
  const end = updateWindow(window, durationMins);
  await addEvent({ title: task.title, description: task.description || "", start_time: slotStart.toISOString(), end_time: end.toISOString() });
  assigned.current += 1;
}

function updateWindow(window, durationMins) {
  const start = new Date(window.start);
  const end = new Date(start.getTime() + durationMins * 60000);
  window.start = end;
  window.minutes -= durationMins;
  return end;
}

function getEventDuration(item) {
  const start = new Date(item.start_time);
  const fallbackEnd = new Date(start.getTime() + 25 * 60000);
  const end = item.end_time ? new Date(item.end_time) : fallbackEnd;
  return { durationMins: Math.round((end - start) / 60000) || 25, end, start };
}
