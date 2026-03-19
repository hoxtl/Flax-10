/*
 * Attendance prompt event helpers.
 */

import { isTimetableEvent } from "../../pages/Attendance/utils/attendanceTimetable";

const PROMPT_WINDOW_START_MIN = 15;

export function isInPromptWindow(event) {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  return Date.now() >= start + PROMPT_WINDOW_START_MIN * 60 * 1000 && Date.now() <= end;
}

export function getDateRangeForPrompt() {
  return { start: offsetPromptDate(-1).toISOString(), end: offsetPromptDate(1).toISOString() };
}

export function findCandidateEvent(events, promptedIds) {
  const timetableEvents = Array.isArray(events) ? events.filter(isTimetableEvent) : [];
  return timetableEvents.find((event) => isInPromptWindow(event) && !promptedIds.has(event.id)) ?? null;
}

function offsetPromptDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}
