/**
 * Homepage data hook: day events, day tasks, and task mutations.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { overlapsDay } from "../../../components/calendar/utils/dateUtils";
import { useCalendar } from "../../../context/CalendarContext";
import { fetchTasks } from "../../../api/taskApi";
import { getEvents } from "../../../api/eventApi";

export function useHomeData(selectedDate) {
  const { events, allEvents } = useCalendar();
  const [allTasks, setAllTasks, tasksLoading, refetchTasks] = useHomepageTasks();
  const [fallbackDayEvents, eventsLoading] = useHomepageDayEvents(selectedDate);
  const dayEvents = useMemo(() => getDayEvents(allEvents, events, fallbackDayEvents, selectedDate), [allEvents, events, fallbackDayEvents, selectedDate]);
  const dayTasks = useMemo(() => getDayTasks(allTasks, selectedDate), [allTasks, selectedDate]);
  const removePendingTask = useCallback((id) => setAllTasks((prev) => prev.filter((task) => task.id !== id)), []);

  return {
    dayEvents,
    dayTasks,
    allTasks,
    removePendingTask,
    refetchTasks,
    loading: tasksLoading || eventsLoading,
  };
}

function getDayEvents(allEvents, events, fallbackDayEvents, selectedDate) {
  const primary = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : events;
  const source = Array.isArray(primary) && primary.length > 0 ? primary : fallbackDayEvents || [];
  return source.filter((event) => overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), selectedDate));
}

function useHomepageTasks() {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const refetchTasks = useCallback(() => loadTasks(setAllTasks), []);

  useEffect(() => {
    setLoading(true);
    refetchTasks().finally(() => setLoading(false));
  }, [refetchTasks]);

  return [allTasks, setAllTasks, loading, refetchTasks];
}

function useHomepageDayEvents(selectedDate) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => loadDayEvents(selectedDate, setEvents, setLoading), [selectedDate]);
  return [events, loading];
}

function getDayTasks(allTasks, selectedDate) {
  const priorities = { urgent: 0, high: 1, medium: 2, low: 3 };
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  return allTasks.filter((task) => !task.completed).filter((task) => task.due_date && new Date(task.due_date) <= dayEnd).sort((left, right) => (priorities[left.priority] ?? 4) - (priorities[right.priority] ?? 4));
}

function loadTasks(setAllTasks) {
  return fetchTasks().then((data) => {
    const nextTasks = data || [];
    setAllTasks(nextTasks);
    return nextTasks;
  }).catch(() => []);
}

function loadDayEvents(selectedDate, setEvents, setLoading) {
  let cancelled = false;
  setLoading(true);
  getEvents(getEventRange(selectedDate)).then((data) => updateEvents(() => cancelled, setEvents, data)).catch(() => updateEvents(() => cancelled, setEvents, [])).finally(() => {
    if (!cancelled) setLoading(false);
  });
  return () => {
    cancelled = true;
  };
}

function updateEvents(isCancelled, setEvents, data) {
  if (!isCancelled()) setEvents(Array.isArray(data) ? data : []);
}

function getEventRange(selectedDate) {
  const dayStart = new Date(selectedDate);
  const dayEnd = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  dayEnd.setHours(23, 59, 59, 999);
  return { start: dayStart.toISOString(), end: dayEnd.toISOString() };
}
