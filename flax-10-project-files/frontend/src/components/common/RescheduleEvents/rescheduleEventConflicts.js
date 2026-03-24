import { overlapsDay } from "../../Calendar/utils/dateUtils";
import { extractBaseEventId, isReadOnlyEvent } from "../../Calendar/utils/eventUtils";

const DAY_START_HOUR = 7;
const TOMORROW_START_HOUR = 9;

export function buildConflictResolutionPlan(events = [], selectedDate = new Date()) {
  const workingEvents = getDayEvents(events, selectedDate).map(cloneEvent);
  const tomorrowDate = getRelativeDate(selectedDate, 1);
  const tomorrowEvents = getDayEvents(events, tomorrowDate).map(cloneEvent);
  const operations = [];
  const unresolved = [];
  const lockedGroups = new Set();
  const tomorrowCursor = getTomorrowStart(selectedDate);
  let guard = 0;

  while (guard < 80) {
    guard += 1;
    workingEvents.sort(compareByStartTime);
    const group = findFirstOverlapGroup(workingEvents, lockedGroups);
    if (!group) break;
    const movableCandidates = getMovableCandidates(group);
    if (!movableCandidates.length) {
      lockedGroups.add(getGroupKey(group));
      unresolved.push({ group, reason: "fixed" });
      continue;
    }
    const resolution = buildGroupResolution(group, movableCandidates, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents);
    if (!resolution) {
      lockedGroups.add(getGroupKey(group));
      unresolved.push({ movable: movableCandidates[0], group, reason: "no-slot" });
      continue;
    }
    const target = workingEvents.find((event) => String(event.id) === String(resolution.movable.id));
    target.start_time = resolution.slot.start.toISOString();
    target.end_time = resolution.slot.end.toISOString();
    if (resolution.slot.movedToTomorrow) tomorrowEvents.push(cloneEvent(target));
    operations.push({
      event: resolution.movable,
      start: resolution.slot.start,
      end: resolution.slot.end,
      movedToTomorrow: resolution.slot.movedToTomorrow,
      originalStart: resolution.movable.start_time,
      originalEnd: resolution.movable.end_time || resolution.movable.start_time,
    });
  }

  return { operations, unresolved };
}

export async function applyConflictResolutionPlan(plan, editEvent) {
  for (const operation of plan.operations) {
    await editEvent(extractBaseEventId(operation.event.id, operation.event), {
      start_time: operation.start.toISOString(),
      end_time: operation.end.toISOString(),
    });
  }
}

export async function undoConflictResolutionPlan(plan, editEvent) {
  for (const operation of plan.operations) {
    await editEvent(extractBaseEventId(operation.event.id, operation.event), {
      start_time: operation.originalStart,
      end_time: operation.originalEnd,
    });
  }
}

export function buildConflictResolutionToastMessage(plan) {
  const fixedUnresolvedCount = plan.unresolved.filter((item) => item.reason === "fixed").length;
  const noSlotCount = plan.unresolved.filter((item) => item.reason === "no-slot").length;
  if (!plan.operations.length && !plan.unresolved.length) return "No overlaps to clear.";
  if (!plan.operations.length && fixedUnresolvedCount && !noSlotCount) return "These overlaps are fixed lectures, societies, or deadline items, so they stay in place.";
  if (!plan.operations.length && noSlotCount && !fixedUnresolvedCount) return "Couldn't find a conflict-free slot for some events.";
  const movedCount = plan.operations.length;
  const tomorrowOperations = plan.operations.filter((operation) => operation.movedToTomorrow);
  const tomorrowCount = tomorrowOperations.length;
  if (!tomorrowCount && !fixedUnresolvedCount && !noSlotCount) return `Cleared ${movedCount} conflict${movedCount === 1 ? "" : "s"}.`;
  const parts = [`Cleared ${movedCount} conflict${movedCount === 1 ? "" : "s"}`];
  if (tomorrowCount) parts.push(buildTomorrowMoveCopy(tomorrowOperations));
  if (fixedUnresolvedCount) parts.push(`${fixedUnresolvedCount} fixed overlap${fixedUnresolvedCount === 1 ? "" : "s"} left in place`);
  if (noSlotCount) parts.push(`${noSlotCount} still need${noSlotCount === 1 ? "s" : ""} manual review`);
  return `${parts.join(" · ")}.`;
}

function getDayEvents(events, selectedDate) {
  return (events || []).filter((event) => {
    if (!event?.start_time) return false;
    const start = new Date(event.start_time);
    const end = new Date(event.end_time || event.start_time);
    return overlapsDay(start, end, selectedDate);
  });
}

function cloneEvent(event) {
  return { ...event };
}

function compareByStartTime(left, right) {
  return new Date(left.start_time) - new Date(right.start_time);
}

function findFirstOverlapGroup(events, lockedGroups) {
  for (let index = 0; index < events.length - 1; index += 1) {
    const group = buildOverlapGroup(events, index);
    if (group.length < 2) continue;
    const groupKey = getGroupKey(group);
    if (lockedGroups.has(groupKey)) {
      index += group.length - 2;
      continue;
    }
    return group;
  }
  return null;
}

function buildOverlapGroup(events, startIndex) {
  const seed = events[startIndex];
  if (!seed) return [];
  const group = [seed];
  let maxEnd = getEndMs(seed);
  for (let index = startIndex + 1; index < events.length; index += 1) {
    const next = events[index];
    if (getStartMs(next) >= maxEnd) break;
    group.push(next);
    maxEnd = Math.max(maxEnd, getEndMs(next));
  }
  return group.length > 1 ? group : [];
}

function getGroupKey(group) {
  return group.map((event) => String(event?.id)).sort().join(":");
}

function isOverlap(left, right) {
  return getEndMs(left) > getStartMs(right);
}

function getMovableCandidates(group) {
  return [...group]
    .filter(isMovableEvent)
    .sort(compareMovableCandidates);
}

function compareMovableCandidates(left, right) {
  const startDiff = getStartMs(right) - getStartMs(left);
  if (startDiff) return startDiff;
  const durationDiff = getDurationMs(left) - getDurationMs(right);
  if (durationDiff) return durationDiff;
  const endDiff = getEndMs(right) - getEndMs(left);
  if (endDiff) return endDiff;
  return String(left.title || "").localeCompare(String(right.title || ""));
}

function buildGroupResolution(group, movableCandidates, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents) {
  for (const movable of movableCandidates) {
    const anchor = getGroupAnchor(group, movable);
    const durationMs = getDurationMs(movable);
    const remainingEvents = workingEvents.filter((event) => String(event.id) !== String(movable.id));
    const after = anchor ? new Date(anchor.end_time || anchor.start_time) : getDayStart(selectedDate);
    const slot = findAvailableDaySlot(remainingEvents, selectedDate, durationMs, after)
      || getTomorrowSlot(tomorrowCursor, tomorrowDate, tomorrowEvents, durationMs);
    if (slot) return { movable, slot };
  }
  return null;
}

function getGroupAnchor(group, movable) {
  const remaining = group.filter((event) => String(event.id) !== String(movable.id));
  if (!remaining.length) return null;
  return [...remaining].sort((left, right) => getEndMs(right) - getEndMs(left))[0];
}

function isMovableEvent(event) {
  return Boolean(event?.id) && !isReadOnlyEvent(event);
}

function getDurationMs(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time || start.getTime() + 25 * 60000);
  return Math.max(25 * 60000, end.getTime() - start.getTime());
}

function getStartMs(event) {
  return new Date(event.start_time).getTime();
}

function getEndMs(event) {
  return new Date(event.end_time || event.start_time).getTime();
}

function findAvailableDaySlot(events, selectedDate, durationMs, after) {
  const dayStart = getDayStart(selectedDate);
  const dayEnd = getDayEnd(selectedDate);
  let cursor = Math.max(dayStart.getTime(), after?.getTime?.() || dayStart.getTime());
  const sorted = [...events].sort(compareByStartTime);
  for (const event of sorted) {
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time || event.start_time).getTime();
    if (eventEnd <= cursor) continue;
    if (eventStart - cursor >= durationMs) {
      return buildSlot(cursor, durationMs, false);
    }
    cursor = Math.max(cursor, eventEnd);
  }
  if (dayEnd.getTime() - cursor >= durationMs) return buildSlot(cursor, durationMs, false);
  return null;
}

function buildSlot(startMs, durationMs, movedToTomorrow) {
  const start = new Date(startMs);
  return { start, end: new Date(startMs + durationMs), movedToTomorrow };
}

function getDayStart(selectedDate) {
  const start = new Date(selectedDate);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  return start;
}

function getDayEnd(selectedDate) {
  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getTomorrowStart(selectedDate) {
  const tomorrow = getRelativeDate(selectedDate, 1);
  tomorrow.setHours(TOMORROW_START_HOUR, 0, 0, 0);
  return tomorrow;
}

function getTomorrowSlot(cursorRef, tomorrowDate, tomorrowEvents, durationMs) {
  const slot = findAvailableDaySlot(tomorrowEvents, tomorrowDate, durationMs, cursorRef);
  if (!slot) return null;
  cursorRef.setTime(slot.end.getTime());
  return { ...slot, movedToTomorrow: true };
}

function getRelativeDate(selectedDate, dayDelta) {
  const date = new Date(selectedDate);
  date.setDate(date.getDate() + dayDelta);
  return date;
}

function buildTomorrowMoveCopy(operations) {
  if (operations.length === 1) {
    return `"${operations[0].event.title}" moved to tomorrow`;
  }
  const titles = operations.slice(0, 2).map((operation) => `"${operation.event.title}"`);
  const extraCount = operations.length - titles.length;
  if (extraCount > 0) {
    return `${operations.length} moved to tomorrow (${titles.join(", ")} +${extraCount} more)`;
  }
  return `${operations.length} moved to tomorrow (${titles.join(", ")})`;
}
