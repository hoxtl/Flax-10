/*
 * Manual schedule helpers.
 */

export function filterScheduleEvents(events, query) {
  const value = query.trim().toLowerCase();
  return value ? events.filter((event) => matchesScheduleEvent(event, value)) : events;
}

function matchesScheduleEvent(event, value) {
  return (event.title || '').toLowerCase().includes(value);
}

export function toggleSelectedEventId(selected, id) {
  return selected.includes(id)
    ? selected.filter((value) => value !== id)
    : [...selected, id];
}

export function getManualScheduleError(title, selected) {
  if (!title.trim()) return 'Please enter a schedule name.';
  if (!selected.length) return 'Select at least one event tagged as schedule.';
  return null;
}
