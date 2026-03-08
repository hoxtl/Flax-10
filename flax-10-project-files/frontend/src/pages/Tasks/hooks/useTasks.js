/**
 * Hook for tasks: load, add, edit, remove, toggle complete.
 */

import { useCallback } from "react";
import { createTask, updateTask, deleteTask } from "../../../api/taskService";
import useTasksLoad from "./useTasksLoad";

export default function useTasks(filters = {}) {
  const { tasks, setTasks, loading, initialLoading, load } = useTasksLoad(filters);
  const addTask = useCallback(async (data) => {
    const created = await createTask(data);
    const merged = { ...created, task_list: created.task_list ?? data.task_list };
    setTasks((prev) => [merged, ...prev]);
    return merged;
  }, [setTasks]);
  const editTask = useCallback(async (id, data) => {
    const updated = await updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, [setTasks]);
  const removeTask = useCallback(async (id) => { await deleteTask(id); setTasks((prev) => prev.filter((t) => t.id !== id)); }, [setTasks]);
  const toggleComplete = useCallback((id, current) => editTask(id, { completed: !current }), [editTask]);
  return { tasks, loading, initialLoading, addTask, editTask, removeTask, toggleComplete, reload: load };
}
