/**
 * Calendar events data hook for the campus map page.
 */
import { useState, useEffect } from 'react';
import { getCalendarEvents } from '../../../api/calendarApi';

async function loadCalendarEvents(setEvents) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const data = await getCalendarEvents();
    setEvents(data.events || []);
  } catch {
    console.log('Unable to load calendar events...');
  }
}

export function useCalendarEvents() {
  const [events, setEvents] = useState([]);
  const load = () => loadCalendarEvents(setEvents);

  useEffect(() => {
    load();
    window.addEventListener('calendar-event-updated', load);
    return () => window.removeEventListener('calendar-event-updated', load);
  }, []);

  return { events };
}
