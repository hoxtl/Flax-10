import { useState, useCallback, useEffect } from "react";
import { fetchTaskLists, createTaskList } from "../../../api/taskService";

export default function useTaskLists() {
  const [lists, setLists] = useState([]);
  const [archivedLists, setArchivedLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchTaskLists();
      const arr = Array.isArray(data) ? data : data?.results ?? [];
      setLists(arr.filter((l) => !l.archived));
      setArchivedLists(arr.filter((l) => l.archived));
    } catch (_) {
      setLists([]);
      setArchivedLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addList = useCallback(async (data) => {
    try {
      const created = await createTaskList(data);
      if (created) setLists((prev) => [...prev, created]);
      return created;
    } catch (_) {
      return null;
    }
  }, []);

  const removeList = useCallback((listId) => {
    setLists((prev) => prev.filter((l) => String(l.id) !== String(listId)));
  }, []);

  const renameList = useCallback((listId, name) => {
    setLists((prev) => prev.map((l) => (String(l.id) === String(listId) ? { ...l, name } : l)));
  }, []);

  const restoreList = useCallback(async (listId) => {
    setArchivedLists((prev) => prev.filter((l) => String(l.id) !== String(listId)));
    await load();
  }, [load]);

  const permanentlyDeleteList = useCallback(async (listId) => {
    setArchivedLists((prev) => prev.filter((l) => String(l.id) !== String(listId)));
  }, []);

  return {
    lists,
    archivedLists,
    loading,
    addList,
    removeList,
    renameList,
    restoreList,
    permanentlyDeleteList,
  };
}
