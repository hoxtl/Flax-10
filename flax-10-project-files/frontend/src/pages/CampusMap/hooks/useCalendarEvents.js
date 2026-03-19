import { useState, useEffect } from 'react';
import { getCalendarEvents } from '../../../api/calendarService';

export function useCalendarEvents() {
  const [events, setEvents] = useState([]);

  const loadEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await getCalendarEvents();
      setEvents(data.events || []);
    } catch {
      console.log('Unable to load calendar events...');
    }
  };

  useEffect(() => {
    loadEvents();
    window.addEventListener('calendar-event-updated', loadEvents);
    return () => window.removeEventListener('calendar-event-updated', loadEvents);
  }, []);

  return { events };
}
