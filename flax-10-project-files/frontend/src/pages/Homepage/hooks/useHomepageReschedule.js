/**
 * Homepage reschedule actions.
 */

import { useCallback, useState } from "react";
import { formatTime, getNextFreeSlotToday } from "../utils/index";
import { extractBaseEventId } from "../../../components/Calendar/utils/eventUtils";
import { applyConflictResolutionPlan, buildConflictResolutionPlan, buildConflictResolutionToastMessage } from "../../../components/common/RescheduleEvents/rescheduleEventConflicts";
import { loadScheduleSettings, submitAutoScheduleWithPrefs } from "../../../components/Schedules/auto/autoScheduleActions";
import { overlapsDay, isToday } from "../../../components/Calendar/utils/dateUtils";
import { buildScheduleAutoForm } from "../utils/ScheduleAutoForm";

export function useHomepageReschedule(props) {
  const [resolveConflictsLoading, setResolveConflictsLoading] = useState(false);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  return {
    handleAutoSchedule: useAutoSchedule(props, setAutoScheduleLoading),
    handleConflictAutoMove: useConflictAutoMove(props),
    handleConflictPushTomorrow: useConflictPushTomorrow(props),
    handleQuickStartGap: useQuickStartGap(props),
    handleResolveTimelineConflicts: useResolveTimelineConflicts(props, setResolveConflictsLoading),
    handleReschedule: useReschedule(props),
    handleRescheduleTomorrow: useRescheduleTomorrow(props),
    handleTimelineDelete: useTimelineDelete(props),
    autoScheduleLoading,
    resolveConflictsLoading,
  };
}

function useAutoSchedule(props, setLoading) {
  return useCallback(async () => {
    setLoading(true);
    try {
      await runAutoSchedule(props);
    } finally {
      setLoading(false);
    }
  }, [props, setLoading]);
}

async function runAutoSchedule(props) {
  if (shouldBlockAutoSchedule(props)) return;
  const settings = await loadScheduleSettings(props.showToast);
  await submitAutoScheduleWithPrefs({
    deadlines: props.upcomingDeadlines,
    settings,
    showToast: props.showToast,
    onDone: () => refreshAutoSchedule(props),
  });
}

function shouldBlockAutoSchedule(props) {
  const dayEvents = filterDayEvents(props.sortedEvents, props.selectedDate);
  const freeWindows = getDayFreeWindows(dayEvents, props.selectedDate);
  if (!freeWindows.length) {
    props.showToast("Can't auto schedule today — there are no free windows.");
    return true;
  }
  const blockNeeds = getBlockNeeds(props.upcomingDeadlines);
  const requiredMinutes = blockNeeds.reduce((sum, mins) => sum + mins, 0);
  const availableMinutes = freeWindows.reduce((sum, win) => sum + (win.minutes || 0), 0);
  // Require at least 25% margin to ensure no overlaps occur
  const requiredWithMargin = requiredMinutes * 1.25;
  if (requiredMinutes > 0 && availableMinutes < requiredWithMargin) {
    props.showToast("Can't auto schedule today — not enough free time to avoid overlaps.");
    return true;
  }
  if (blockNeeds.length && !canFitBlocks(freeWindows, blockNeeds)) {
    props.showToast("Can't auto schedule today — no single window fits the required study blocks.");
    return true;
  }
  return false;
}

function filterDayEvents(events = [], selectedDate) {
  return events.filter((event) => overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), selectedDate));
}

function getBlockNeeds(deadlines = []) {
  const form = buildScheduleAutoForm({ deadlines });
  const prefs = form?.deadline_preferences || [];
  return prefs.map((pref) => pref.ideal_minutes_per_day || 0).filter((mins) => mins > 0);
}

function canFitBlocks(windows, blocks) {
  const sortedWindows = windows.map((win) => ({ ...win })).sort((a, b) => b.minutes - a.minutes);
  const sortedBlocks = [...blocks].sort((a, b) => b - a);
  for (const block of sortedBlocks) {
    const targetIndex = sortedWindows.findIndex((win) => win.minutes >= block);
    if (targetIndex === -1) return false;
    sortedWindows[targetIndex].minutes -= block;
  }
  return true;
}

function getDayFreeWindows(events = [], selectedDate) {
  const dayStart = new Date(selectedDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  const cursorStart = isToday(selectedDate) ? Math.max(dayStart.getTime(), now.getTime()) : dayStart.getTime();
  if (cursorStart >= dayEnd.getTime()) return [];
  const windows = [];
  let cursor = cursorStart;
  const sorted = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  sorted.forEach((event) => {
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time || event.start_time).getTime();
    if (eventEnd <= cursor) return;
    if (eventStart > cursor) windows.push(buildWindow(cursor, eventStart));
    cursor = Math.max(cursor, eventEnd);
  });
  if (cursor < dayEnd.getTime()) windows.push(buildWindow(cursor, dayEnd.getTime()));
  return windows.map(({ start, end }) => ({
    start,
    end,
    minutes: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  })).filter((win) => win.minutes >= 15);
}

function buildWindow(startMs, endMs) {
  return { start: new Date(startMs), end: new Date(endMs) };
}

async function refreshAutoSchedule(props) {
  await props.loadEvents?.();
  props.refetchTasks?.();
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
      const result = await applyConflictResolutionPlan(plan, props.editEvent);
      const failureCount = result?.failures?.length ?? 0;
      if (failureCount === plan.operations.length) {
        props.showToast("Couldn't reschedule your events. Some conflicts are read-only.");
        return;
      }
      await props.loadEvents?.();
      props.refetchTasks();
      const message = buildConflictResolutionToastMessage(plan);
      props.showToast(failureCount ? `${message} ${failureCount} couldn't be moved.` : message, { durationMs: 8500 });
    } catch {
      props.showToast("Couldn't reschedule your events. Try again.");
    } finally {
      setResolveConflictsLoading(false);
    }
  }, [props, setResolveConflictsLoading]);
}

function getEventDuration(item) {
  const start = new Date(item.start_time);
  const fallbackEnd = new Date(start.getTime() + 25 * 60000);
  const end = item.end_time ? new Date(item.end_time) : fallbackEnd;
  return { durationMins: Math.round((end - start) / 60000) || 25, end, start };
}
