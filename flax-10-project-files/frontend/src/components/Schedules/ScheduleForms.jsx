import { useEffect, useMemo, useState } from 'react';

import { getUpcomingDeadlines } from '../../api/deadlineApi';
import { getEvents, updateEvent } from '../../api/eventApi';
import { createSchedule } from '../../api/scheduleApi';
import { useToast } from '../../context/ToastContext';
import styles from '../Dashboard/QuickAddModal.module.css';
import { resolveConflictPlansBeforeScheduling } from '../../pages/Homepage/components/useAutoResolveScheduleConflicts';

export function ScheduleManualForm({ onDone }) {
  const showToast = useToast();
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
        showToast('Unable to load schedule-tagged events.', { variant: 'error' });
      });
  }, [showToast]);

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
      showToast('Please enter a schedule name.', { variant: 'error' });
      return;
    }

    if (!selected.length) {
      showToast('Select at least one event tagged as schedule.', { variant: 'error' });
      return;
    }

    try {
      const data = await createSchedule({ mode: 'manual', title: title.trim(), event_ids: selected });
      if (data.overwritten) {
        showToast('A schedule with this name existed and was replaced.', { variant: 'info' });
      }
      showToast(`Saved ${selected.length} events to "${title.trim()}".`, { variant: 'success' });
      onDone?.();
    } catch (error) {
      showToast(error.message, { variant: 'error' });
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
  const showToast = useToast();
  const [title, setTitle] = useState('Auto schedule');
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    getUpcomingDeadlines()
      .then(setDeadlines)
      .catch(() => {
        showToast('Unable to load upcoming deadlines.', { variant: 'error' });
      });
  }, [showToast]);

  const submit = async () => {
    if (!deadlines.length) {
      showToast('No upcoming deadlines to auto-schedule.', { variant: 'error' });
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
      const moveEvent = async (event, startTime, endTime) => updateEvent(event.id, {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      await resolveConflictPlansBeforeScheduling({
        getFreshEvents: () => getEvents(),
        selectedDate: new Date(),
        onConflictAutoMove: (event, startTime, endTime) => moveEvent(event, startTime, endTime),
        onPushTomorrow: (event) => {
          const start = new Date(event.start_time);
          const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 25 * 60000);
          const durationMins = Math.max(25, Math.round((end - start) / 60000) || 25);
          const nextDay = new Date(start);
          nextDay.setDate(nextDay.getDate() + 1);
          const movedEnd = new Date(nextDay.getTime() + durationMins * 60000);
          return moveEvent(event, nextDay, movedEnd);
        },
      });

      const data = await createSchedule(payload);
      if (data.overwritten) {
        showToast('A schedule with this name existed and was replaced.', { variant: 'info' });
      }
      showToast(`Generated schedule: "${payload.title}".`, { variant: 'success' });
      onDone?.();
    } catch (error) {
      showToast(error.message, { variant: 'error' });
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
