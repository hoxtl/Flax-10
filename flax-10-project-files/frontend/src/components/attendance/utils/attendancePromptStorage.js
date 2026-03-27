/*
 * Attendance prompt storage.
 *
 * localStorage  — permanently answered events (Yes / No).  Survives across sessions.
 * sessionStorage — dismissed events for the current session only.  Cleared on new login.
 */

const ANSWERED_KEY  = "flax_attendance_prompted_ids";
const DISMISSED_KEY = "flax_attendance_session_dismissed";
const LAST_SHOWN_AT_KEY = "flax_attendance_prompt_last_shown_at";

function readSet(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(storage, key, ids) {
  try {
    storage.setItem(key, JSON.stringify([...ids]));
  } catch {
    // storage quota or private-mode — silently ignore
  }
}

/** IDs of events the user has answered (Yes/No). Persists across logins. */

export function getPromptedIds() {
  return readSet(localStorage, ANSWERED_KEY);
}

/** Mark an event as permanently answered (Yes/No). */

export function setPromptedId(eventId) {
  const ids = getPromptedIds();
  ids.add(eventId);
  writeSet(localStorage, ANSWERED_KEY, ids);
}

/** IDs of events dismissed this session. Cleared when the browser session ends. */

export function getSessionDismissedIds() {
  return readSet(sessionStorage, DISMISSED_KEY);
}

/** Mark an event as dismissed for this session only. */

export function setSessionDismissedId(eventId) {
  const ids = getSessionDismissedIds();
  ids.add(eventId);
  writeSet(sessionStorage, DISMISSED_KEY, ids);
}

/** Combined set of event IDs to skip (answered permanently + dismissed this session). */

export function getSkippedIds() {
  return new Set([...getPromptedIds(), ...getSessionDismissedIds()]);
}

export function getLastPromptShownAt() {
  const raw = sessionStorage.getItem(LAST_SHOWN_AT_KEY);
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

export function setLastPromptShownAt(timestamp = Date.now()) {
  try {
    sessionStorage.setItem(LAST_SHOWN_AT_KEY, String(timestamp));
  } catch {
    // storage quota or private-mode — silently ignore
  }
}
