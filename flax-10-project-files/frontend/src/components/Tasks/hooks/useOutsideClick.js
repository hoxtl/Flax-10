import { useEffect } from "react";

export function useOutsideClick(
  open,
  panelRef,
  menuRef,
  taskMenuRef,
  fabRef,
  onClose,
  setMenuOpen,
  setTaskMenuId
) {
  useEffect(() => {
    if (!open) return;

    const cleanup = setupListeners(
      panelRef,
      menuRef,
      taskMenuRef,
      fabRef,
      onClose,
      setMenuOpen,
      setTaskMenuId
    );

    return cleanup;
  }, [open, onClose]);
}

function setupListeners(
  panelRef,
  menuRef,
  taskMenuRef,
  fabRef,
  onClose,
  setMenuOpen,
  setTaskMenuId
) {
  const onDown = createMouseHandler(
    panelRef,
    menuRef,
    taskMenuRef,
    fabRef,
    onClose,
    setMenuOpen,
    setTaskMenuId
  );

  const onKey = createKeyHandler(setMenuOpen, setTaskMenuId, onClose);

  document.addEventListener("mousedown", onDown);
  document.addEventListener("keydown", onKey);

  return () => {
    document.removeEventListener("mousedown", onDown);
    document.removeEventListener("keydown", onKey);
  };
}

function createMouseHandler(
  panelRef,
  menuRef,
  taskMenuRef,
  fabRef,
  onClose,
  setMenuOpen,
  setTaskMenuId
) {
  return (e) => {
    handleMenuClose(e, menuRef, setMenuOpen);
    handleTaskMenuClose(e, taskMenuRef, setTaskMenuId);
    handlePanelClose(e, panelRef, menuRef, taskMenuRef, fabRef, onClose);
  };
}

function handleMenuClose(e, menuRef, setMenuOpen) {
  if (menuRef.current && !menuRef.current.contains(e.target)) {
    setMenuOpen(false);
  }
}

function handleTaskMenuClose(e, taskMenuRef, setTaskMenuId) {
  const clickedDotsBtn = e.target.closest?.("[data-task-menu-btn='true']");
  if (!clickedDotsBtn) {
    if (taskMenuRef.current && !taskMenuRef.current.contains(e.target)) {
      setTaskMenuId(null);
    }
  }
}

function handlePanelClose(e, panelRef, menuRef, taskMenuRef, fabRef, onClose) {
  const clickedInPanel = panelRef.current?.contains(e.target);
  const clickedInTopMenu = menuRef.current?.contains(e.target);
  const clickedInTaskMenu = taskMenuRef.current?.contains(e.target);
  const clickedFAB = fabRef?.current?.contains(e.target);

  const outside = !clickedInPanel && !clickedInTopMenu && !clickedInTaskMenu && !clickedFAB;

  if (outside) {
    onClose?.();
  }
}

function createKeyHandler(setMenuOpen, setTaskMenuId, onClose) {
  return (e) => {
    if (e.key === "Escape") {
      setMenuOpen(false);
      setTaskMenuId(null);
      onClose?.();
    }
  };
}