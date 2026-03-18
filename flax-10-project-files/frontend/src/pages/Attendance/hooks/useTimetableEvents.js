import { useEffect, useState, useCallback } from "react";
import { getEvents } from "../../../api/eventApi";

function isTimetableEvent(event) {
  return event?.source && event?.external_id;
}

/** Single responsibility: fetch events and filter to timetable only. */
export function useTimetableEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setDate(start.getDate() - 14);
      const end = new Date();
      end.setDate(end.getDate() + 30);
      const data = await getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const list = Array.isArray(data) ? data.filter(isTimetableEvent) : [];
      setEvents(list);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, refetch: load };
}
