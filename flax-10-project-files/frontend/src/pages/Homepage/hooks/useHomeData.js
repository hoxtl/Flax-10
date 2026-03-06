/**
 * Homepage data hook: day events, day tasks, and task mutations.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { useCalendar } from "../../../context/CalendarContext";
import { fetchTasks } from "../../../api/taskService";
import { getEvents } from "../../../api/eventApi";

export function useHomeData(selectedDate) {
  const { events, allEvents } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  const [fallbackDayEvents, setFallbackDayEvents] = useState([]);

  useEffect(() => {
    fetchTasks()
      .then((data) => setAllTasks(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    getEvents({ start: dayStart.toISOString(), end: dayEnd.toISOString() })
      .then((data) => {
        if (!cancelled) setFallbackDayEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFallbackDayEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const dayEvents = useMemo(() => {
    const primary = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : events;
    const merged = [...(primary || []), ...(fallbackDayEvents || [])];
    const deduped = merged.filter((e, idx, arr) => {
      if (!e || e.id == null) return false;
      return arr.findIndex((x) => x && x.id === e.id) === idx;
    });
    return deduped.filter((e) =>
      overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), selectedDate)
    );
  }, [allEvents, events, fallbackDayEvents, selectedDate]);

  const dayTasks = useMemo(() => {
    const incomplete = allTasks.filter((t) => !t.completed);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return incomplete
      .filter((t) => t.due_date && new Date(t.due_date) <= dayEnd)
      .sort((a, b) => (p[a.priority] ?? 4) - (p[b.priority] ?? 4));
  }, [allTasks, selectedDate]);

  const removePendingTask = useCallback((id) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refetchTasks = useCallback(() => {
    fetchTasks().then((data) => setAllTasks(data || [])).catch(() => {});
  }, []);

  return { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks };
}
