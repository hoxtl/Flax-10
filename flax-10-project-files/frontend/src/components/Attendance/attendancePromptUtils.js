/** Single responsibility: decide if an event is in the "prompt window" for attendance. */

const PROMPT_WINDOW_START_MIN = 15;

export function isTimetableEvent(event) {
  return event?.source && event?.external_id;
}

export function isInPromptWindow(event) {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  const now = Date.now();
  const windowStart = start + PROMPT_WINDOW_START_MIN * 60 * 1000;
  return now >= windowStart && now <= end;
}

export function getDateRangeForPrompt() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function findCandidateEvent(events, promptedIds) {
  const timetable = Array.isArray(events) ? events.filter(isTimetableEvent) : [];
  return timetable.find((e) => isInPromptWindow(e) && !promptedIds.has(e.id)) ?? null;
}
