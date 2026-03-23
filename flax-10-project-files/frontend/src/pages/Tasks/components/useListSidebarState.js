import { useState } from "react";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";

export function useListSidebarState(tasks, lists) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteListId, setDeleteListId] = useState(null);
  const [permDeleteId, setPermDeleteId] = useState(null);
  const { listCounts, smartFilters } = computeListSidebarCounts(tasks, lists);

  const handleCtxMenu = (event, listId) => {
    event.preventDefault();
    setCtxMenu({ x: event.clientX, y: event.clientY, listId });
  };

  return {
    ctxMenu,
    setCtxMenu,
    renamingId,
    setRenamingId,
    showArchived,
    setShowArchived,
    deleteListId,
    setDeleteListId,
    permDeleteId,
    setPermDeleteId,
    listCounts,
    smartFilters,
    handleCtxMenu,
  };
}
