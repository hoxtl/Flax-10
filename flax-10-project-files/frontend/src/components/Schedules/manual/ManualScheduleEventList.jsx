/*
 * Manual schedule event list.
 */

import styles from '../shared/scheduleFormStyles';

export function ManualScheduleEventList({ events, filteredEvents, selected, toggle }) {
  return (
    <div className={styles.eventList}>
      <EmptyScheduleEvents events={events} />
      <EmptySearchResults events={events} filteredEvents={filteredEvents} />
      {filteredEvents.map((event) => <EventOption key={event.id} event={event} selected={selected} toggle={toggle} />)}
    </div>
  );
}

function EmptyScheduleEvents({ events }) {
  return events.length ? null : <p className={styles.muted}>No events tagged "schedule" were found.</p>;
}

function EmptySearchResults({ events, filteredEvents }) {
  return events.length && !filteredEvents.length ? <p className={styles.muted}>No events match your search.</p> : null;
}

function EventOption({ event, selected, toggle }) {
  return (
    <label className={styles.checkRow}>
      <input type="checkbox" checked={selected.includes(event.id)} onChange={() => toggle(event.id)} />
      <span>{event.title}</span>
    </label>
  );
}
