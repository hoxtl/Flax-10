/*
 * Attendance prompt event helpers.
 */

import { isTimetableEvent } from "../../pages/Attendance/utils/attendanceTimetable";

const PROMPT_WINDOW_START_MIN = 15;
const PAST_PROMPT_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export function isInPromptWindow(event) {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  const now = Date.now();
  const isLive = now >= start + PROMPT_WINDOW_START_MIN * 60 * 1000 && now <= end;
  const isRecentPast = now > end && (now - end) <= PAST_PROMPT_WINDOW_MS;
  return isLive || isRecentPast;
}

export function getDateRangeForPrompt() {
  return { start: offsetPromptDate(-2).toISOString(), end: offsetPromptDate(1).toISOString() };
}

export function findCandidateEvent(events, skippedIds) {
  const timetableEvents = Array.isArray(events) ? events.filter(isTimetableEvent) : [];
  return timetableEvents.find((event) => isInPromptWindow(event) && !skippedIds.has(event.id)) ?? null;
}

function offsetPromptDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}
