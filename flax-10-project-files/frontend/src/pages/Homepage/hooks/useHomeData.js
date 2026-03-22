/**
 * Homepage data hook: day events, day tasks, and task mutations.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { useCalendar } from "../../../context/CalendarContext";
import { fetchTasks } from "../../../api/tasks/taskApi";
import { getEvents } from "../../../api/calendar/eventApi";

export function useHomeData(selectedDate) {
  const { events, allEvents } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  const [fallbackDayEvents, setFallbackDayEvents] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    setTasksLoading(true);
    fetchTasks()
      .then((data) => setAllTasks(data || []))
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const dayEvents = useMemo(() => {
    const primary = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : events;
    const source = Array.isArray(primary) && primary.length > 0 ? primary : (fallbackDayEvents || []);
    return source.filter((e) =>
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
    return fetchTasks()
      .then((data) => {
        const nextTasks = data || [];
        setAllTasks(nextTasks);
        return nextTasks;
      })
      .catch(() => {
        return [];
      });
  }, []);

  return {
    dayEvents,
    dayTasks,
    allTasks,
    removePendingTask,
    refetchTasks,
    loading: tasksLoading || eventsLoading,
  };
}
