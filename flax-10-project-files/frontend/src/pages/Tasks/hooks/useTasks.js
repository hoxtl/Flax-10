/**
 * Hook for tasks: load, add, edit, remove, toggle complete.
 */

import { useCallback } from "react";
import { createTask, updateTask, deleteTask } from "../../../api/taskService";
import useTasksLoad from "./useTasksLoad";
import { recalculatePendingBlocks } from "../utils/readingSpeedUtils";

function useToggleComplete(editTask, setTasks) { 
  return useCallback(async(id, current) => {
    const updated = await editTask(id, {completed: !current});
    if (current === false && (updated?.reading_id || updated?.page_count)) 
      setTasks((prev) => recalculatePendingBlocks(prev.map((t) => (t.id === id ? updated: t))));
    return updated;
  }, [editTask, setTasks]);
}

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
  const toggleComplete = useToggleComplete(editTask, setTasks);
  return { tasks, loading, initialLoading, addTask, editTask, removeTask, toggleComplete, reload: load };
}
