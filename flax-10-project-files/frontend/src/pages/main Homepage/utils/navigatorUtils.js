/**
 * Homepage Daily Navigator helpers. Pure functions only.
 */

import { isNow } from "./eventUtils";
import { getAllFreeWindowsToday } from "./slotUtils";

/** Find overlapping event pairs in sorted events. Returns [{ a, b, overlapStart, overlapEnd }]. */
export function getOverlappingPairs(sortedEvents) {
  if (!sortedEvents?.length) return [];
  const pairs = [];
  const sorted = [...sortedEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aEnd = new Date(a.end_time || a.start_time).getTime();
    const bStart = new Date(b.start_time).getTime();
    if (aEnd > bStart) {
      pairs.push({
        a,
        b,
        overlapStart: new Date(bStart),
        overlapEnd: new Date(Math.min(aEnd, new Date(b.end_time || b.start_time).getTime())),
      });
    }
  }
  return pairs;
}

/** Daily Navigator context: task/gap/conflict/endOfDay, currentBlock, nextItem, gapMins, overlaps. */
export function getNavigatorContext(now, selectedDate, sortedEvents, isTodayFn) {
  const defaultCtx = {
    state: "none",
    currentBlock: null,
    nextItem: null,
    gapMins: null,
    overlaps: [],
    conflictAt: null,
    firstGapWindow: null,
  };
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) return defaultCtx;

  const overlaps = getOverlappingPairs(sortedEvents);
  const nowMs = now.getTime();
  const conflictNow = overlaps.find((p) => {
    const start = p.overlapStart.getTime();
    const end = p.overlapEnd.getTime();
    return nowMs >= start && nowMs <= end;
  });
  const conflictUpcoming = overlaps.find((p) => p.overlapStart.getTime() > nowMs);

  const currentBlock = sortedEvents.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
  const future = sortedEvents
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextItem = future[0] ?? null;
  const gapMs = nextItem ? new Date(nextItem.start_time).getTime() - nowMs : 0;
  const gapMins = Math.floor(gapMs / 60000);

  const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
  const firstGapWindow = windows[0] ?? null;

  if (conflictNow || conflictUpcoming) {
    const c = conflictNow || conflictUpcoming;
    return {
      ...defaultCtx,
      state: "conflict",
      currentBlock: conflictNow ? currentBlock : null,
      nextItem,
      overlaps,
      conflictAt: c.overlapStart,
    };
  }

  if (currentBlock) {
    return { ...defaultCtx, state: "task", currentBlock, nextItem, overlaps };
  }

  if (!nextItem) {
    return { ...defaultCtx, state: "endOfDay", overlaps };
  }

  return {
    ...defaultCtx,
    state: "gap",
    nextItem,
    gapMins,
    firstGapWindow: firstGapWindow?.minutes >= 15 ? firstGapWindow : null,
    overlaps,
  };
}
