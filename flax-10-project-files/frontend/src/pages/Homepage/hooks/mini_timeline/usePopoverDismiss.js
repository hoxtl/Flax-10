/*
 * Dismisses a popover when clicking outside its ref while it is active.
 */

import { useEffect } from "react";

export function usePopoverDismiss(activeId, popoverRef, onClose) {
  useEffect(() => {
    if (!activeId) return undefined;
    const handleClickOutside = (event) => {
      if (popoverRef.current?.contains(event.target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeId, onClose, popoverRef]);
}
