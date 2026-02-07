const KEY = "studyflax_events_v1";
const USE_API = false; //change later

// For now, events are stored in localStorage under the above key change later.
export function loadEvents() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

// Expects an array of events. Each event should have at least { id, date, type, title }.
export function saveEvents(events) {
    localStorage.setItem(KEY, JSON.stringify(events)); //change later to API call when backend exists
}

/*
NEXT (when login exists):
- loadEvents() should fetch from API using the logged-in user id/token.
- saveEvents() should POST/PUT to API.
- Keep the same event shape so frontend components do not change.
*/

// Adds an event and returns the saved event with id.
export function addEvent(event) {
  const events = loadEvents();
  const saved = { ...event, id: crypto.randomUUID?.() || String(Date.now()) };
  saveEvents([...events, saved]);
  return saved;
}

// Deletes an event by id.
export function deleteEvent(id) {
  const events = loadEvents().filter(e => e.id !== id);
  saveEvents(events);
}

// Returns events for a given date.
export function eventsForDate(events, date) {
  const d = toYmd(date);
  return events.filter(e => e.date === d);
}

export function toYmd(date) {
  // Accept Date, timestamp, or date-string. Fallback to today if invalid.
  const x = date instanceof Date ? new Date(date.getTime()) : new Date(date);

  if (Number.isNaN(x.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  }

  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}
