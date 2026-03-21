/*
 * Task loading hook used by the tasks state layer.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchTasks } from "../../../api/taskApi";

async function loadTasks(filters, setTasks, setLoading, setInitialLoading) {
  setLoading(true);
  try {
    setTasks(await fetchTasks(filters));
  } catch {
    setTasks([]);
  } finally {
    setLoading(false);
    setInitialLoading(false);
  }
}

export default function useTasksLoad(filters) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const filterKey = JSON.stringify(filters ?? {});
  const load = useCallback(() => loadTasks(filters ?? {}, setTasks, setLoading, setInitialLoading), [filterKey]);
  useEffect(() => { load(); }, [load]);
  return { tasks, setTasks, loading, initialLoading, load };
}
