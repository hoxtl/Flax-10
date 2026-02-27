/**
 * Homepage data hook: day events, day tasks, and task mutations.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { useCalendar } from "../../../context/CalendarContext";
import { useCalendarEvents } from "../../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks } from "../../../api/taskService";

export function useHomeData(selectedDate) {
  const { events } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  useCalendarEvents();

  useEffect(() => {
    fetchTasks()
      .then((data) => setAllTasks(data || []))
      .catch(() => {});
  }, []);

  const dayEvents = useMemo(
    () => events.filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)),
    [events, selectedDate]
  );

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
