/*
 * Shared helpers for the study coach feature.
 */

export const STUDY_COACH_ERROR = "Could not get a response. Please try again.";

export function trimMessage(value) {
  return (value || "").trim();
}

export function createUserMessage(content) {
  return { role: "user", content };
}

export function createAssistantMessage(response) {
  return {
    role: "assistant",
    content: response.reply,
    suggested_events: response.suggested_events || [],
  };
}

export function buildNextMessages(messages, content) {
  return [...messages, createUserMessage(content)];
}

export function resetStatuses(events) {
  return events.map(() => "idle");
}

export function updateStatusAtIndex(index, nextStatus) {
  return (statuses) => statuses.map((value, current) => (current === index ? nextStatus : value));
}

export function getPendingImports(statuses) {
  return statuses.filter((status) => status !== "done").length;
}

export function formatEventTime(start, end) {
  return `${formatStart(start)} – ${formatEnd(end)}`;
}

function formatStart(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEnd(value) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
