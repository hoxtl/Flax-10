/*
 * Task data hook for loading, creating, editing, deleting, and completing tasks.
 */

import { useCallback } from "react";
import { createTask, updateTask, deleteTask } from "../../../api/taskApi";
import useTasksLoad from "./useTasksLoad";
import { recalculatePendingBlocks } from "../utils/readingSpeedUtils";

function applyReadingRecalc(id, updated, setTasks) {
  if (updated?.reading_id || updated?.page_count)
    setTasks((prev) => recalculatePendingBlocks(prev.map((t) => (t.id === id ? updated : t))));
}

function revertToggle(id, current, setTasks) {
  setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: current } : t)));
}

async function runToggle(id, current, editTask, setTasks) {
  setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !current } : t)));
  const updated = await editTask(id, { completed: !current })
    .catch(() => revertToggle(id, current, setTasks));
  if (!current && updated) applyReadingRecalc(id, updated, setTasks);
  return updated;
}

function useToggleComplete(editTask, setTasks) {
  return useCallback((id, current) => runToggle(id, current, editTask, setTasks), [editTask, setTasks]);
}

function restoreRemovedTask(setTasks, removedTask, removedIndex) {
  if (!removedTask) return;
  setTasks((prev) => [...prev.slice(0, removedIndex), removedTask, ...prev.slice(removedIndex)]);
}

function useRemoveTask(setTasks) {
  return useCallback(async (id) => {
    let removedTask = null;
    let removedIndex = -1;
    setTasks((prev) => {
      removedIndex = prev.findIndex((task) => task.id === id);
      removedTask = removedIndex >= 0 ? prev[removedIndex] : null;
      return prev.filter((task) => task.id !== id);
    });
    try { await deleteTask(id); } catch (error) { restoreRemovedTask(setTasks, removedTask, removedIndex); throw error; }
  }, [setTasks]);
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
  const removeTask = useRemoveTask(setTasks);
  const toggleComplete = useToggleComplete(editTask, setTasks);
  return { tasks, loading, initialLoading, addTask, editTask, removeTask, toggleComplete, reload: load };
}
