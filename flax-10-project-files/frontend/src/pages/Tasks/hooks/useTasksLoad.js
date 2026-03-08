/**
 * Load tasks from API. Used by useTasks.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchTasks } from "../../../api/taskService";

export default function useTasksLoad(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    fetchTasks(filters).then(setTasks).catch(() => {}).finally(() => { setLoading(false); setInitialLoading(false); });
  }, [JSON.stringify(filters)]);
  useEffect(() => {
    load();
  }, [load]);
  return { tasks, setTasks, loading, initialLoading, load };
}
