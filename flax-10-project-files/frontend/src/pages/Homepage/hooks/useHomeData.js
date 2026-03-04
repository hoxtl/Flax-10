import { useState, useEffect, useCallback } from "react";
import { useCalendar } from "../../../context/CalendarContext";
import { fetchTasks } from "../../../api/taskService";
import { isToday, overlapsDay } from "../../../components/Calendar/utils/dateUtils";

/**
 * Provides day-scoped events (calendar + tasks) and task lists for the Homepage.
 */
export function useHomeData(selectedDate) {
  const { events: allCalEvents } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetchTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setAllTasks(Array.isArray(data) ? data : data?.results ?? []);
    } catch (_) {
      setAllTasks([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks()
      .then((data) => {
        if (!cancelled) setAllTasks(Array.isArray(data) ? data : data?.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setAllTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const dayStart = selectedDate ? new Date(selectedDate) : new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const calList = Array.isArray(allCalEvents) ? allCalEvents : (allCalEvents?.results && Array.isArray(allCalEvents.results) ? allCalEvents.results : []);
  const dayEvents = calList.filter((e) =>
    overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), dayStart)
  );

  const dayTasks = (allTasks || []).filter((t) => {
    const due = t.due_date || t.due || t.scheduled_date;
    if (!due) return isToday(dayStart);
    const d = new Date(due);
    return d.toDateString() === dayStart.toDateString();
  });

  const removePendingTask = useCallback((taskId) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId && t.id !== String(taskId)));
  }, []);

  return {
    dayEvents,
    dayTasks,
    allTasks,
    removePendingTask,
    refetchTasks,
    loading,
  };
}
