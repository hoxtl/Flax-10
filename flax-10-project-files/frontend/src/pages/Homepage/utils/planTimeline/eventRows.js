/*
 * Event and gap row builders for the plan timeline.
 */

import { extractModuleCode, isNow, isRoutineEvent } from "../eventUtils";
import { DAY_END_HOUR, DAY_START_HOUR, FIXED_ROW_GAP_PX, GAP_CARD_THRESHOLD_MINS } from "./constants";
import { computeGapContext } from "./gapContext";

function getMinutesFromDayStart(date, hourLimit) {
  return Math.max(0, Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes(), hourLimit));
}

function findMatchingTask(item, dayTasks, tasksDueToday) {
  const matchTitle = (task) => (task.title || "").trim() === (item.title || "").trim();
  return (dayTasks || []).find(matchTitle) || (tasksDueToday || []).find(matchTitle) || null;
}

function hasOverlap(item, inWindow) {
  const start = new Date(item.start_time).getTime();
  const end = new Date(item.end_time || item.start_time).getTime();
  return inWindow.some((other) => other.id !== item.id && new Date(other.start_time).getTime() < end && new Date(other.end_time || other.start_time).getTime() > start);
}

function buildGapEntry(lastEndMins, startMins, index, prevItem, nextItem) {
  const gapMins = startMins - lastEndMins;
  if (gapMins < GAP_CARD_THRESHOLD_MINS) return gapMins > 0 ? { type: "tinyGap", id: `tiny-${index}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins } : null;
  return { type: "free", id: `free-${index}`, startMins: lastEndMins, endMins: startMins, minutes: gapMins, gapStartMins: lastEndMins, gapContext: computeGapContext(prevItem, nextItem, lastEndMins, gapMins) };
}

export function filterEventsInWindow(sortedEvents, dayStart, dayEnd) {
  return (sortedEvents || []).filter((event) => new Date(event.end_time || event.start_time).getTime() > dayStart.getTime() && new Date(event.start_time).getTime() < dayEnd.getTime());
}

export function buildGapOrTinyGap(lastEndMins, startMins, index, prevItem, nextItem) {
  return buildGapEntry(lastEndMins, startMins, index, prevItem, nextItem);
}

export function buildEventEntry(item, inWindow, now, dayTasks, tasksDueToday) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time || item.start_time);
  const startMins = getMinutesFromDayStart(start, Infinity);
  const endMins = getMinutesFromDayStart(end, (DAY_END_HOUR - DAY_START_HOUR) * 60);
  return {
    type: "event",
    id: item.id,
    item,
    startMins,
    endMins,
    durationMins: endMins - startMins,
    isPast: end < now,
    active: isNow(item.start_time, item.end_time),
    matchTask: findMatchingTask(item, dayTasks, tasksDueToday),
    isOverlap: hasOverlap(item, inWindow),
    isRoutine: isRoutineEvent(item),
    moduleCode: item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description) || null,
  };
}

function getRowStart(row) {
  if (row.type === "event") return row.startMins;
  if (row.type === "free" || row.type === "tinyGap") return row.startMins ?? row.gapStartMins;
  return null;
}

function getRowEnd(row) {
  if (row.type === "event") return row.endMins;
  if (row.type === "free" || row.type === "tinyGap") return row.endMins ?? ((row.gapStartMins ?? 0) + (row.minutes ?? 0));
  return null;
}

function withSpacing(row, previousRow, index) {
  if (index === 0) return { ...row, spacingBeforePx: 0 };
  const previousEnd = getRowEnd(previousRow);
  const currentStart = getRowStart(row);
  const spacingBeforePx = previousEnd != null && currentStart != null && currentStart <= previousEnd ? 0 : FIXED_ROW_GAP_PX;
  return { ...row, spacingBeforePx };
}

function buildEventGroup(items, baseRow, chunkIndex) {
  const startMins = Math.min(...items.map((item) => item.startMins));
  const endMins = Math.max(...items.map((item) => item.endMins));
  return { type: "eventGroup", id: `group-${baseRow.id}-${chunkIndex}`, items, startMins, endMins, spacingBeforePx: chunkIndex === 0 ? baseRow.spacingBeforePx : 0 };
}

function collectOverlappingGroup(rows, startIndex) {
  const group = [rows[startIndex]];
  let nextIndex = startIndex + 1;
  let groupEnd = rows[startIndex].endMins;
  while (rows[nextIndex]?.type === "event" && rows[nextIndex].startMins < groupEnd) {
    groupEnd = Math.max(groupEnd, rows[nextIndex].endMins);
    group.push(rows[nextIndex]);
    nextIndex += 1;
  }
  return { group, nextIndex };
}

function getEventGroupChunks(group, baseRow) {
  if (group.length === 1) return [baseRow];
  return [buildEventGroup(group, baseRow, 0)];
}

function appendGroupedRows(rows, index, result) {
  if (index >= rows.length) return result;
  const row = rows[index];
  if (row.type !== "event") return appendGroupedRows(rows, index + 1, [...result, row]);
  const { group, nextIndex } = collectOverlappingGroup(rows, index);
  return appendGroupedRows(rows, nextIndex, [...result, ...getEventGroupChunks(group, row)]);
}

export function addSpacing(rows) {
  return rows.map((row, index) => withSpacing(row, rows[index - 1], index));
}

export function groupOverlappingEvents(rows) {
  return appendGroupedRows(rows, 0, []);
}
