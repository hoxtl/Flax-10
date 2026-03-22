/**
 * Homepage Daily Navigator helpers. Pure functions only.
 */

import { isNow } from "./eventUtils";
import { getAllFreeWindowsToday } from "./slotUtils";

function createDefaultContext() {
  return {
    state: "none",
    currentBlock: null,
    nextItem: null,
    gapMins: null,
    overlaps: [],
    conflictAt: null,
    firstGapWindow: null,
  };
}

function getSortedEvents(sortedEvents) {
  return [...(sortedEvents || [])].sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
}

function buildOverlapPair(current, next) {
  return {
    a: current,
    b: next,
    overlapStart: new Date(next.start_time),
    overlapEnd: new Date(Math.min(new Date(current.end_time || current.start_time).getTime(), new Date(next.end_time || next.start_time).getTime())),
  };
}

function getConflict(overlaps, nowMs) {
  return overlaps.find((pair) => isActiveConflict(pair, nowMs)) || overlaps.find((pair) => pair.overlapStart.getTime() > nowMs) || null;
}

function isActiveConflict(pair, nowMs) {
  const start = pair.overlapStart.getTime();
  const end = pair.overlapEnd.getTime();
  return nowMs >= start && nowMs <= end;
}

/** Find overlapping event pairs in sorted events. Returns [{ a, b, overlapStart, overlapEnd }]. */
export function getOverlappingPairs(sortedEvents) {
  if (!sortedEvents?.length) return [];
  const pairs = [];
  const sorted = getSortedEvents(sortedEvents);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentEnd = new Date(current.end_time || current.start_time).getTime();
    const nextStart = new Date(next.start_time).getTime();
    if (currentEnd > nextStart) pairs.push(buildOverlapPair(current, next));
  }
  return pairs;
}

/** Daily Navigator context: task/gap/conflict/endOfDay, currentBlock, nextItem, gapMins, overlaps. */
export function getNavigatorContext(now, selectedDate, sortedEvents, isTodayFn) {
  const defaultCtx = createDefaultContext();
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) return defaultCtx;

  const overlaps = getOverlappingPairs(sortedEvents);
  const nowMs = now.getTime();
  const conflict = getConflict(overlaps, nowMs);
  const currentBlock = sortedEvents.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
  const future = getSortedEvents(sortedEvents).filter((event) => event.start_time && new Date(event.start_time).getTime() > nowMs);
  const nextItem = future[0] ?? null;
  const gapMs = nextItem ? new Date(nextItem.start_time).getTime() - nowMs : 0;
  const gapMins = Math.floor(gapMs / 60000);
  const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
  const firstGapWindow = windows[0] ?? null;
  if (conflict) return buildConflictContext(defaultCtx, currentBlock, nextItem, overlaps, conflict, nowMs);
  if (currentBlock) return { ...defaultCtx, state: "task", currentBlock, nextItem, overlaps };
  if (!nextItem) return { ...defaultCtx, state: "endOfDay", overlaps };
  return buildGapContext(defaultCtx, nextItem, gapMins, firstGapWindow, overlaps);
}

function buildConflictContext(defaultCtx, currentBlock, nextItem, overlaps, conflict, nowMs) {
  return {
    ...defaultCtx,
    state: "conflict",
    currentBlock: isActiveConflict(conflict, nowMs) ? currentBlock : null,
    nextItem,
    overlaps,
    conflictAt: conflict.overlapStart,
  };
}

function buildGapContext(defaultCtx, nextItem, gapMins, firstGapWindow, overlaps) {
  return {
    ...defaultCtx,
    state: "gap",
    nextItem,
    gapMins,
    firstGapWindow: firstGapWindow?.minutes >= 15 ? firstGapWindow : null,
    overlaps,
  };
}
