/**
 * Hook for task lists: load, add, rename, remove, restore, permanently delete.
 */

import { useCallback } from "react";
import useTaskListsLoad from "./useTaskListsLoad";
import { addListImpl, renameListImpl, removeListImpl, restoreListImpl, permanentlyDeleteListImpl } from "../utils/useTaskListsUtils";

export default function useTaskLists() {
  const { lists, setLists, archivedLists, setArchivedLists, loading, load, loadArchived } = useTaskListsLoad();
  const addList = useCallback((data) => addListImpl(setLists, data), [setLists]);
  const renameList = useCallback((id, data) => renameListImpl(setLists, id, data), [setLists]);
  const removeList = useCallback((id) => removeListImpl(setLists, loadArchived, id), [setLists, loadArchived]);
  const restoreList = useCallback((id) => restoreListImpl(load, loadArchived, id), [load, loadArchived]);
  const permanentlyDeleteList = useCallback((id) => permanentlyDeleteListImpl(setArchivedLists, id), [setArchivedLists]);
  return { lists, archivedLists, loading, addList, removeList, renameList, restoreList, permanentlyDeleteList, reload: load, reloadArchived: loadArchived };
}
