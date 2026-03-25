/*
 * List sidebar state hook for task management.
 */
import { useState } from "react";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";

function useSidebarControls() {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteListId, setDeleteListId] = useState(null);
  const [permDeleteId, setPermDeleteId] = useState(null);
  return { ctxMenu, setCtxMenu, renamingId, setRenamingId, showArchived, setShowArchived, deleteListId, setDeleteListId, permDeleteId, setPermDeleteId };
}

export function useListSidebarState(tasks, lists) {
  const controls = useSidebarControls();
  const { listCounts, smartFilters } = computeListSidebarCounts(tasks, lists);
  const handleCtxMenu = (event, listId) => { event.preventDefault(); controls.setCtxMenu({ x: event.clientX, y: event.clientY, listId }); };
  return { ...controls, listCounts, smartFilters, handleCtxMenu };
}
