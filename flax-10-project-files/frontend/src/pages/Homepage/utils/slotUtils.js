/*
 * Homepage slot/window helpers. Pure functions only.
 */

import { isToday, overlapsDay } from "../../../components/Calendar/utils/dateUtils";

export function getDayBounds(selectedDate) {
  const dayStart = new Date(selectedDate);
  const dayEnd = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

function getDayEvents(events, selectedDate) {
  return (events || [])
    .filter((event) => overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), selectedDate))
    .sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
}

function buildWindow(startMs, minutes) {
  return {
    start: new Date(startMs),
    end: new Date(startMs + minutes * 60000),
    minutes,
  };
}

/** True if the given time falls in the sleep window 23:00–06:00. */

export function isNightSlot(startTime) {
  if (!startTime) return false;
  const h = new Date(startTime).getHours();
  return h >= 23 || h < 6;
}

/** Next free slot today that fits durationMins; returns { start, end } or null. */

export function getNextFreeSlotToday(events, selectedDate, durationMins) {
  if (!isToday(selectedDate) || durationMins <= 0) return null;
  const { dayStart, dayEnd } = getDayBounds(selectedDate);
  const now = new Date();
  if (now >= dayEnd) return null;
  const dayEvents = getDayEvents(events, selectedDate);
  const cursor = getCursorAfterEvents(dayEvents, Math.max(now.getTime(), dayStart.getTime()), durationMins);
  return getRemainingSlot(cursor, dayEnd, durationMins);
}

/** All free windows (gaps) from now to end of day. Returns [{ start, end, minutes }]. */

export function getAllFreeWindowsToday(events, selectedDate) {
  if (!isToday(selectedDate)) return [];
  const { dayStart, dayEnd } = getDayBounds(selectedDate);
  const now = new Date();
  if (now >= dayEnd) return [];
  const dayEvents = getDayEvents(events, selectedDate);
  const windows = [];
  let cursor = Math.max(now.getTime(), dayStart.getTime());
  for (const event of dayEvents) cursor = pushWindowBeforeEvent(event, cursor, windows);
  const remainingMins = Math.round((dayEnd.getTime() - cursor) / 60000);
  if (remainingMins >= 15) windows.push(buildWindow(cursor, remainingMins));
  return windows;
}

function getGapSlot(event, cursor, durationMins) {
  const eventStart = new Date(event.start_time).getTime();
  const gapMins = (eventStart - cursor) / 60000;
  return eventStart > cursor && gapMins >= durationMins ? buildWindow(cursor, durationMins) : null;
}

function getEventEnd(event, cursor) {
  const eventEnd = new Date(event.end_time || event.start_time).getTime();
  return eventEnd > cursor ? eventEnd : cursor;
}

function pushWindowBeforeEvent(event, cursor, windows) {
  const eventStart = new Date(event.start_time).getTime();
  if (eventStart > cursor) addWindow(windows, cursor, eventStart);
  return getEventEnd(event, cursor);
}

function addWindow(windows, startMs, endMs) {
  const minutes = Math.round((endMs - startMs) / 60000);
  if (minutes >= 15) windows.push(buildWindow(startMs, minutes));
}

function getCursorAfterEvents(dayEvents, initialCursor, durationMins) {
  let cursor = initialCursor;
  for (const event of dayEvents) cursor = getNextCursor(event, cursor, durationMins);
  return cursor;
}

function getRemainingSlot(cursor, dayEnd, durationMins) {
  const remainingMins = (dayEnd.getTime() - cursor) / 60000;
  return remainingMins >= durationMins ? buildWindow(cursor, durationMins) : null;
}

function getNextCursor(event, cursor, durationMins) {
  const slot = getGapSlot(event, cursor, durationMins);
  return slot ? slot.start.getTime() : getEventEnd(event, cursor);
}
