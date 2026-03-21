/*
 * Attendance prompt event helpers.
 */

<<<<<<< HEAD
import { isTimetableEvent } from "../../pages/attendance/utils/attendanceTimetable";

const PROMPT_WINDOW_START_MIN = 15;
const PAST_PROMPT_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
=======
import { isTimetableEvent } from "../../pages/Attendance/utils/attendanceTimetable";

const PROMPT_WINDOW_START_MIN = 15;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function isInPromptWindow(event) {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
<<<<<<< HEAD
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
=======
  return Date.now() >= start + PROMPT_WINDOW_START_MIN * 60 * 1000 && Date.now() <= end;
}

export function getDateRangeForPrompt() {
  return { start: offsetPromptDate(-1).toISOString(), end: offsetPromptDate(1).toISOString() };
}

export function findCandidateEvent(events, promptedIds) {
  const timetableEvents = Array.isArray(events) ? events.filter(isTimetableEvent) : [];
  return timetableEvents.find((event) => isInPromptWindow(event) && !promptedIds.has(event.id)) ?? null;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function offsetPromptDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}
