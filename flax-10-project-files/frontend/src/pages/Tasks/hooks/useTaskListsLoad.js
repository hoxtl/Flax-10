/*
 * Load task lists and archived lists. Used by useTaskLists.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchTaskLists, fetchArchivedTaskLists } from "../../../api/tasks/taskApi";
import { mergeListColors } from "../utils/useTaskListsUtils";

export default function useTaskListsLoad() {
  const [lists, setLists] = useState([]);
  const [archivedLists, setArchivedLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    fetchTaskLists().then((d) => setLists(mergeListColors(d))).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const loadArchived = useCallback(() => {
    fetchArchivedTaskLists().then((d) => setArchivedLists(mergeListColors(d))).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadArchived(); }, [loadArchived]);
  return { lists, setLists, archivedLists, setArchivedLists, loading, load, loadArchived };
}
