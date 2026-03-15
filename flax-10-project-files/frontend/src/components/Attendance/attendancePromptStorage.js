/** Single responsibility: persist which event IDs we have already prompted for. */

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
  const set = getPromptedIds();
  set.add(eventId);
  localStorage.setItem(PROMPTED_KEY, JSON.stringify([...set]));
}
