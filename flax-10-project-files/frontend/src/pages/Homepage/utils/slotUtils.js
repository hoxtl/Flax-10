/**
 * Homepage slot/window helpers. Pure functions only.
 */

import { isToday, overlapsDay } from "../../../components/Calendar/utils/dateUtils";

/** True if the given time falls in the sleep window 23:00–06:00. */
export function isNightSlot(startTime) {
  if (!startTime) return false;
  const h = new Date(startTime).getHours();
  return h >= 23 || h < 6;
}

/** Next free slot today that fits durationMins; returns { start, end } or null. */
export function getNextFreeSlotToday(events, selectedDate, durationMins) {
  if (!isToday(selectedDate) || durationMins <= 0) return null;
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  if (now >= dayEnd) return null;
  const dayEvents = (events || [])
    .filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  let cursor = Math.max(now.getTime(), dayStart.getTime());
  for (const ev of dayEvents) {
    const evStart = new Date(ev.start_time).getTime();
    const evEnd = new Date(ev.end_time || ev.start_time).getTime();
    if (evStart > cursor) {
      const gapMins = (evStart - cursor) / 60000;
      if (gapMins >= durationMins) {
        return { start: new Date(cursor), end: new Date(cursor + durationMins * 60000) };
      }
    }
    if (evEnd > cursor) cursor = evEnd;
  }
  const remainingMins = (dayEnd.getTime() - cursor) / 60000;
  if (remainingMins >= durationMins) {
    return { start: new Date(cursor), end: new Date(cursor + durationMins * 60000) };
  }
  return null;
}

/** All free windows (gaps) from now to end of day. Returns [{ start, end, minutes }]. */
export function getAllFreeWindowsToday(events, selectedDate) {
  if (!isToday(selectedDate)) return [];
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  if (now >= dayEnd) return [];
  const dayEvents = (events || [])
    .filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const windows = [];
  let cursor = Math.max(now.getTime(), new Date(selectedDate).setHours(0, 0, 0, 0));
  for (const ev of dayEvents) {
    const evStart = new Date(ev.start_time).getTime();
    const evEnd = new Date(ev.end_time || ev.start_time).getTime();
    if (evStart > cursor) {
      const minutes = Math.round((evStart - cursor) / 60000);
      if (minutes >= 15) {
        windows.push({
          start: new Date(cursor),
          end: new Date(evStart),
          minutes,
        });
      }
    }
    if (evEnd > cursor) cursor = evEnd;
  }
  const remainingMins = Math.round((dayEnd.getTime() - cursor) / 60000);
  if (remainingMins >= 15) {
    windows.push({
      start: new Date(cursor),
      end: new Date(cursor + remainingMins * 60000),
      minutes: remainingMins,
    });
  }
  return windows;
}
