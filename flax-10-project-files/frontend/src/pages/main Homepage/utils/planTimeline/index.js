/*
 * Public plan timeline row computation API.
 */

import { DAY_END_HOUR, DAY_START_HOUR } from "./constants";
import { addSpacing, buildEventEntry, buildGapOrTinyGap, filterEventsInWindow, groupOverlappingEvents } from "./eventRows";
import { injectHourMarks, insertNowMarker } from "./hourMarks";

function getNowMins(now) {
  return Math.max(0, (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes());
}

function buildEntries(inWindow, now, dayTasks, tasksDueToday) {
  return inWindow.reduce((state, item, index) => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time || item.start_time);
    const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
    const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());
    const gap = state.lastEndMins != null ? buildGapOrTinyGap(state.lastEndMins, startMins, index, state.lastItem, item) : null;
    return { entries: [...state.entries, ...(gap ? [gap] : []), buildEventEntry(item, inWindow, now, dayTasks, tasksDueToday)], lastEndMins: Math.max(state.lastEndMins ?? 0, endMins), lastItem: item };
  }, { entries: [], lastEndMins: null, lastItem: null }).entries;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => (a.startMins ?? 0) - (b.startMins ?? 0));
}

export { CAMPUS_DISPLAY } from "./constants";

export function computePlanTimelineRows(sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday, isToday) {
  const inWindow = filterEventsInWindow(sortedEvents, dayStart, dayEnd);
  const groupedRows = groupOverlappingEvents(addSpacing(sortRows(buildEntries(inWindow, now, dayTasks, tasksDueToday))));
  const rowsWithNow = selectedDate && now && isToday(selectedDate) ? insertNowMarker(groupedRows, getNowMins(now)) : groupedRows;
  return injectHourMarks(rowsWithNow);
}
