/*
 * Event conflict resolution planning utilities.
 */
import { overlapsDay } from "../../Calendar/utils/dateUtils";
import { extractBaseEventId, isReadOnlyEvent } from "../../Calendar/utils/eventUtils";

const DAY_START_HOUR = 7;
const TOMORROW_START_HOUR = 9;

function handleNoMovableCandidates(group, lockedGroups, unresolved) {
  lockedGroups.add(getGroupKey(group));
  unresolved.push({ group, reason: "fixed" });
}

function handleNoResolution(group, movableCandidates, lockedGroups, unresolved) {
  lockedGroups.add(getGroupKey(group));
  unresolved.push({ movable: movableCandidates[0], group, reason: "no-slot" });
}

function applyResolution(resolution, workingEvents, tomorrowEvents, operations) {
  const target = workingEvents.find((event) => String(event.id) === String(resolution.movable.id));
  target.start_time = resolution.slot.start.toISOString();
  target.end_time = resolution.slot.end.toISOString();
  if (resolution.slot.movedToTomorrow) tomorrowEvents.push(cloneEvent(target));
  operations.push({ event: resolution.movable, start: resolution.slot.start, end: resolution.slot.end, movedToTomorrow: resolution.slot.movedToTomorrow, originalStart: resolution.movable.start_time, originalEnd: resolution.movable.end_time || resolution.movable.start_time });
}

function processOverlapGroup(ctx) {
  const { workingEvents, lockedGroups, unresolved, operations, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents } = ctx;
  workingEvents.sort(compareByStartTime);
  const group = findFirstOverlapGroup(workingEvents, lockedGroups);
  if (!group) return false;
  const movableCandidates = getMovableCandidates(group);
  if (!movableCandidates.length) { handleNoMovableCandidates(group, lockedGroups, unresolved); return true; }
  const resolution = buildGroupResolution(group, movableCandidates, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents);
  if (!resolution) { handleNoResolution(group, movableCandidates, lockedGroups, unresolved); return true; }
  applyResolution(resolution, workingEvents, tomorrowEvents, operations);
  return true;
}

export function buildConflictResolutionPlan(events = [], selectedDate = new Date()) {
  const workingEvents = getDayEvents(events, selectedDate).map(cloneEvent);
  const tomorrowDate = getRelativeDate(selectedDate, 1);
  const tomorrowEvents = getDayEvents(events, tomorrowDate).map(cloneEvent);
  const operations = [], unresolved = [], lockedGroups = new Set();
  const tomorrowCursor = getTomorrowStart(selectedDate);
  const ctx = { workingEvents, lockedGroups, unresolved, operations, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents };
  for (let guard = 0; guard < 80; guard += 1) { if (!processOverlapGroup(ctx)) break; }
  return { operations, unresolved };
}

export async function applyConflictResolutionPlan(plan, editEvent) {
  const failures = [];
  for (const operation of plan.operations) {
    try {
      await editEvent(extractBaseEventId(operation.event.id, operation.event), {
        start_time: operation.start.toISOString(),
        end_time: operation.end.toISOString(),
      });
    } catch {
      failures.push(operation);
    }
  }
  return { failures };
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
  if (!plan.operations.length && !plan.unresolved.length) return "No overlap events.";
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

function isValidOverlapGroup(group, lockedGroups) {
  if (group.length < 2) return false;
  return !lockedGroups.has(getGroupKey(group));
}

function processOverlapCandidate(events, lockedGroups, index) {
  const group = buildOverlapGroup(events, index);
  if (isValidOverlapGroup(group, lockedGroups)) return { group, skip: 0 };
  return { group: null, skip: group.length >= 2 ? group.length - 2 : 0 };
}

function findFirstOverlapGroup(events, lockedGroups) {
  let index = 0;
  while (index < events.length - 1) { const result = processOverlapCandidate(events, lockedGroups, index); if (result.group) return result.group; index += 1 + result.skip; }
  return null;
}

function shouldExtendGroup(next, maxEndRef) {
  return getStartMs(next) < maxEndRef.value;
}

function extendOverlapGroup(events, startIndex, group, maxEndRef) {
  for (let index = startIndex + 1; index < events.length && shouldExtendGroup(events[index], maxEndRef); index += 1) { group.push(events[index]); maxEndRef.value = Math.max(maxEndRef.value, getEndMs(events[index])); }
}

function buildOverlapGroup(events, startIndex) {
  const seed = events[startIndex];
  if (!seed) return [];
  const group = [seed];
  const maxEndRef = { value: getEndMs(seed) };
  extendOverlapGroup(events, startIndex, group, maxEndRef);
  return group.length > 1 ? group : [];
}

function getGroupKey(group) {
  return group.map((event) => String(event?.id)).sort().join(":");
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

function tryResolveMovable(movable, group, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents) {
  const anchor = getGroupAnchor(group, movable);
  const durationMs = getDurationMs(movable);
  const remainingEvents = workingEvents.filter((event) => String(event.id) !== String(movable.id));
  const after = anchor ? new Date(anchor.end_time || anchor.start_time) : getDayStart(selectedDate);
  const slot = findAvailableDaySlot(remainingEvents, selectedDate, durationMs, after) || getTomorrowSlot(tomorrowCursor, tomorrowDate, tomorrowEvents, durationMs);
  return slot ? { movable, slot } : null;
}

function buildGroupResolution(group, movableCandidates, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents) {
  return movableCandidates.reduce((found, movable) => found || tryResolveMovable(movable, group, workingEvents, selectedDate, tomorrowCursor, tomorrowDate, tomorrowEvents), null);
}

function getGroupAnchor(group, movable) {
  const remaining = group.filter((event) => String(event.id) !== String(movable.id));
  if (!remaining.length) return null;
  return [...remaining].sort((left, right) => getEndMs(right) - getEndMs(left))[0];
}

function isMovableEvent(event) {
  if (!event?.id) return false;
  return !isReadOnlyEvent(event);
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

function tryFitBeforeEvent(cursor, event, durationMs) {
  const eventStart = new Date(event.start_time).getTime();
  const eventEnd = new Date(event.end_time || event.start_time).getTime();
  if (eventEnd <= cursor) return { cursor, slot: null };
  if (eventStart - cursor >= durationMs) return { cursor, slot: buildSlot(cursor, durationMs, false) };
  return { cursor: Math.max(cursor, eventEnd), slot: null };
}

function scanEventsForSlot(sorted, cursor, durationMs) {
  return sorted.reduce((acc, event) => { if (acc.slot) return acc; const result = tryFitBeforeEvent(acc.cursor, event, durationMs); return result.slot ? { cursor: result.cursor, slot: result.slot } : { cursor: result.cursor, slot: null }; }, { cursor, slot: null });
}

function findAvailableDaySlot(events, selectedDate, durationMs, after) {
  const dayStart = getDayStart(selectedDate);
  const dayEnd = getDayEnd(selectedDate);
  const cursor = Math.max(dayStart.getTime(), after?.getTime?.() || dayStart.getTime());
  const result = scanEventsForSlot([...events].sort(compareByStartTime), cursor, durationMs);
  if (result.slot) return result.slot;
  return dayEnd.getTime() - result.cursor >= durationMs ? buildSlot(result.cursor, durationMs, false) : null;
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
