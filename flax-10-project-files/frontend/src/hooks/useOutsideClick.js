import { useEffect } from "react";

export function useOutsideClick(open, panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
  useEffect(() => {
    if (!open) return;
    return setupListeners(panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId);
  }, [open, onClose]);
}

function setupListeners(panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
  const onDown = createMouseHandler(panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId);
  const onKey = createKeyHandler(setMenuOpen, setTaskMenuId, onClose);
  document.addEventListener("mousedown", onDown);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("mousedown", onDown);
    document.removeEventListener("keydown", onKey);
  };
}

function createMouseHandler(panelRef, menuRef, taskMenuRef, fabRef, onClose, setMenuOpen, setTaskMenuId) {
  return (e) => {
    handleMenuClose(e, menuRef, setMenuOpen);
    handleTaskMenuClose(e, taskMenuRef, setTaskMenuId);
    handlePanelClose(e, panelRef, menuRef, taskMenuRef, fabRef, onClose);
  };
}

function handleMenuClose(e, menuRef, setMenuOpen) {
  if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
}

function handleTaskMenuClose(e, taskMenuRef, setTaskMenuId) {
  const clickedDotsBtn = e.target.closest?.("[data-task-menu-btn='true']");
  if (!clickedDotsBtn && taskMenuRef.current && !taskMenuRef.current.contains(e.target)) {
    setTaskMenuId(null);
  }
}

function handlePanelClose(e, panelRef, menuRef, taskMenuRef, fabRef, onClose) {
  const outside = !panelRef.current?.contains(e.target)
    && !menuRef.current?.contains(e.target)
    && !taskMenuRef.current?.contains(e.target)
    && !fabRef?.current?.contains(e.target);
  if (outside) onClose?.();
}

function createKeyHandler(setMenuOpen, setTaskMenuId, onClose) {
  return (e) => {
    if (e.key !== "Escape") return;
    setMenuOpen(false);
    setTaskMenuId(null);
    onClose?.();
  };
}