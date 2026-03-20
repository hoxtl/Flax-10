/*
 * Attendance prompt storage.
 */

const PROMPTED_KEY = "flax_attendance_prompted_ids";

export function getPromptedIds() {
  try {
    const raw = localStorage.getItem(PROMPTED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function setPromptedId(eventId) {
  const ids = getPromptedIds();
  ids.add(eventId);
  localStorage.setItem(PROMPTED_KEY, JSON.stringify([...ids]));
}
