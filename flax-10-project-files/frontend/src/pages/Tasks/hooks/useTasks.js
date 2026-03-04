import { useState, useCallback, useEffect } from "react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../../../api/taskService";

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(Array.isArray(data) ? data : data?.results ?? []);
    } catch (_) {
      setTasks([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTasks()
      .then((data) => {
        if (!cancelled) setTasks(Array.isArray(data) ? data : data?.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const addTask = useCallback(async (data) => {
    try {
      const created = await createTask(data);
      setTasks((prev) => (created ? [...prev, created] : prev));
      return created;
    } catch (_) {
      return null;
    }
  }, []);

  const editTask = useCallback(async (id, data) => {
    try {
      const updated = await updateTask(id, data);
      setTasks((prev) => prev.map((t) => (String(t.id) === String(id) ? { ...t, ...updated } : t)));
      return updated;
    } catch (_) {
      return null;
    }
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(id)));
    deleteTask(id).catch(() => {});
  }, []);

  const toggleComplete = useCallback(async (id, currentCompleted) => {
    const newCompleted = !currentCompleted;
    try {
      await updateTask(id, { completed: newCompleted });
      setTasks((prev) => prev.map((t) => (String(t.id) === String(id) ? { ...t, completed: newCompleted } : t)));
    } catch (_) {}
  }, []);

  return {
    tasks,
    initialLoading,
    addTask,
    editTask,
    removeTask,
    toggleComplete,
    reload,
  };
}
