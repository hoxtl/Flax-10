/**
 * Plan timeline row computation. Pure functions only.
 */

import { isNow } from "./eventUtils";
import { extractModuleCode } from "./eventUtils";
import { isRoutineEvent } from "./eventUtils";
import { DAY_START_HOUR, DAY_END_HOUR, GAP_CARD_THRESHOLD_MINS, FIXED_ROW_GAP_PX } from "./timelineUtils";

function filterEventsInWindow(sortedEvents, dayStart, dayEnd) {
  return (sortedEvents || []).filter((e) => {
    const s = new Date(e.start_time).getTime();
    const eEnd = new Date(e.end_time || e.start_time).getTime();
    return eEnd > dayStart.getTime() && s < dayEnd.getTime();
  });
}

function addGapOrTinyGap(entries, lastEndMins, startMins, i) {
  const gapMins = startMins - lastEndMins;
  if (gapMins > 0 && gapMins < GAP_CARD_THRESHOLD_MINS) {
    entries.push({ type: "tinyGap", id: `tiny-${i}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins });
  } else if (gapMins >= GAP_CARD_THRESHOLD_MINS) {
    entries.push({ type: "free", id: `free-${i}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins, gapStartMins: lastEndMins });
  }
}

function buildEventEntry(item, inWindow, i, dayStart, dayEnd, now, dayTasks, tasksDueToday) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time || item.start_time);
  const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
  const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());
  const isPast = end < now;
  const active = isNow(item.start_time, item.end_time);
  const matchTask = (dayTasks || []).find((t) => (t.title || "").trim() === (item.title || "").trim())
    || (tasksDueToday || []).find((t) => (t.title || "").trim() === (item.title || "").trim());
  const modCode = item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description);
  const isRoutine = isRoutineEvent(item);

  let isOverlap = false;
  for (let j = 0; j < inWindow.length; j++) {
    if (j === i) continue;
    const other = inWindow[j];
    const oStart = new Date(other.start_time).getTime();
    const oEnd = new Date(other.end_time || other.start_time).getTime();
    const myStart = start.getTime();
    const myEnd = end.getTime();
    if (oStart < myEnd && oEnd > myStart) {
      isOverlap = true;
      break;
    }
  }

  return {
    type: "event",
    id: item.id,
    item,
    startMins,
    endMins,
    durationMins: endMins - startMins,
    isPast,
    active,
    matchTask,
    isOverlap,
    isRoutine,
    moduleCode: modCode || null,
  };
}

function insertNowMarker(sorted, nowMins) {
  const endMinsOf = (r) => r.endMins ?? (r.gapStartMins ?? 0) + (r.minutes ?? 0);
  let insertIndex = sorted.length;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (endMinsOf(sorted[i]) <= nowMins) {
      insertIndex = i + 1;
      break;
    }
  }
  sorted.splice(insertIndex, 0, { type: "now", id: "now-marker", nowMins });
}

function addSpacingAndOverlapIndex(sorted) {
  let overlapGroupIndex = 0;

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    r.spacingBeforePx = i === 0 ? 0 : FIXED_ROW_GAP_PX;
    if (r.type === "event") {
      const prev = sorted[i - 1];
      const overlapsPrev = prev && prev.type === "event" && prev.endMins > r.startMins && r.endMins > prev.startMins;
      overlapGroupIndex = overlapsPrev ? overlapGroupIndex + 1 : 0;
      r.overlapGroupIndex = overlapGroupIndex;
    }
  }
}

function injectHourMarksAndGroupOverlaps(sorted) {
  const finalRows = [];
  let lastInjectedHour = -1;

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const rStartMins = r.type !== "now" ? (r.startMins ?? r.gapStartMins ?? null) : null;
    if (rStartMins != null) {
      const rowHour = DAY_START_HOUR + Math.floor(rStartMins / 60);
      if (rowHour !== lastInjectedHour) {
        finalRows.push({ type: "hourMark", id: `hour-${rowHour}`, hour: rowHour });
        lastInjectedHour = rowHour;
      }
    }

    if (r.type === "event" && r.isOverlap && r.overlapGroupIndex === 0) {
      const group = [r];
      for (let j = i + 1; j < sorted.length && sorted[j].type === "event" && sorted[j].overlapGroupIndex > 0; j++) {
        group.push(sorted[j]);
      }
      finalRows.push({
        type: "eventGroup",
        id: `conflict-${r.id}`,
        items: group,
        spacingBeforePx: r.spacingBeforePx,
        startMins: r.startMins,
        endMins: Math.max(...group.map((x) => x.endMins)),
      });
      i += group.length - 1;
    } else if (r.type === "event") {
      finalRows.push(r);
    } else {
      finalRows.push(r);
    }
  }
  return finalRows;
}

/** Compute plan timeline rows from events and tasks. */
export function computePlanTimelineRows(sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday, isToday) {
  const inWindow = filterEventsInWindow(sortedEvents, dayStart, dayEnd);
  const entries = [];
  let lastEndMins = null;

  for (let i = 0; i < inWindow.length; i++) {
    const item = inWindow[i];
    const start = new Date(item.start_time);
    const end = new Date(item.end_time || item.start_time);
    const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
    const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());

    if (lastEndMins != null) {
      addGapOrTinyGap(entries, lastEndMins, startMins, i);
    }

    entries.push(buildEventEntry(item, inWindow, i, dayStart, dayEnd, now, dayTasks, tasksDueToday));
    lastEndMins = Math.max(lastEndMins ?? 0, endMins);
  }

  const sorted = [...entries].sort((a, b) => (a.startMins ?? 0) - (b.startMins ?? 0));
  const showNow = selectedDate && now && isToday(selectedDate);
  const nowMins = showNow ? Math.max(0, (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes()) : null;
  if (showNow && nowMins != null && nowMins >= 0) {
    insertNowMarker(sorted, nowMins);
  }

  addSpacingAndOverlapIndex(sorted);
  return injectHourMarksAndGroupOverlaps(sorted);
}
