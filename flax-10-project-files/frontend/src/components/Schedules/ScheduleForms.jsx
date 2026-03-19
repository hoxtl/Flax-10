import { useEffect, useMemo, useState } from 'react';

import { getUpcomingDeadlines } from '../../api/deadlineApi';
import { getEvents } from '../../api/eventApi';
import { createSchedule } from '../../api/scheduleApi';
import { useNotifications } from '../../context/NotificationContext';
import styles from '../Dashboard/QuickAddModal.module.css';

export function ScheduleManualForm({ onDone }) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    getEvents()
      .then((all) => {
        const scheduleTagged = all.filter((event) => (event.tag_name || '').toLowerCase() === 'schedule');
        setEvents(scheduleTagged);
        setSelected(scheduleTagged.map((event) => event.id));
      })
      .catch(() => {
        addNotification({
          title: 'Schedule',
          message: 'Unable to load schedule-tagged events.',
          notification_type: 'general',
        });
      });
  }, [addNotification]);

  const filteredEvents = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) => (event.title || '').toLowerCase().includes(query));
  }, [eventSearch, events]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!title.trim()) {
      addNotification({ title: 'Schedule name required', message: 'Please enter a schedule name.', notification_type: 'general' });
      return;
    }

    if (!selected.length) {
      addNotification({ title: 'No events selected', message: 'Select at least one event tagged as schedule.', notification_type: 'general' });
      return;
    }

    try {
      const data = await createSchedule({ mode: 'manual', title: title.trim(), event_ids: selected });
      if (data.overwritten) {
        addNotification({ title: 'Schedule overwritten', message: 'A schedule with this name existed and was replaced.', notification_type: 'general' });
      }
      addNotification({ title: 'Schedule created', message: `Saved ${selected.length} events to ${title.trim()}.`, notification_type: 'general' });
      onDone?.();
    } catch (error) {
      addNotification({ title: 'Create schedule failed', message: error.message, notification_type: 'general' });
    }
  };

  return (
    <div className={styles.formWrap}>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="My study schedule" />
      <label className={styles.fieldLabel}>Search events</label>
      <input
        className={styles.input}
        value={eventSearch}
        onChange={(event) => setEventSearch(event.target.value)}
        placeholder="Search schedule events"
      />
      <div className={styles.eventList}>
        {events.length === 0 && <p className={styles.muted}>No events tagged "schedule" were found.</p>}
        {events.length > 0 && filteredEvents.length === 0 && <p className={styles.muted}>No events match your search.</p>}
        {filteredEvents.map((event) => (
          <label key={event.id} className={styles.checkRow}>
            <input type="checkbox" checked={selected.includes(event.id)} onChange={() => toggle(event.id)} />
            <span>{event.title}</span>
          </label>
        ))}
      </div>
      <button className={styles.primaryBtn} type="button" onClick={submit}>Create Schedule</button>
    </div>
  );
}

export function ScheduleAutoForm({ onDone }) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('Auto schedule');
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    getUpcomingDeadlines()
      .then(setDeadlines)
      .catch(() => {
        addNotification({ title: 'Schedule', message: 'Unable to load upcoming deadlines.', notification_type: 'general' });
      });
  }, [addNotification]);

  const submit = async () => {
    if (!deadlines.length) {
      addNotification({ title: 'No deadlines', message: 'No upcoming deadlines to auto-schedule.', notification_type: 'general' });
      return;
    }

    const payload = {
      title: title.trim() || 'Auto schedule',
      deadline_preferences: deadlines.map((deadline) => ({
        deadline_id: deadline.id,
        ideal_minutes_per_day: 60,
      })),
    };

    try {
      const data = await createSchedule(payload);
      if (data.overwritten) {
        addNotification({ title: 'Schedule overwritten', message: 'A schedule with this name existed and was replaced.', notification_type: 'general' });
      }
      addNotification({ title: 'Auto schedule created', message: `Generated schedule: ${payload.title}.`, notification_type: 'general' });
      onDone?.();
    } catch (error) {
      addNotification({ title: 'Auto schedule failed', message: error.message, notification_type: 'general' });
    }
  };

  return (
    <div className={styles.formWrap}>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Auto schedule" />
      <p className={styles.muted}>Will schedule {deadlines.length} upcoming deadlines with 60 min/day blocks.</p>
      <button className={styles.primaryBtn} type="button" onClick={submit}>Generate Auto Schedule</button>
    </div>
  );
}
