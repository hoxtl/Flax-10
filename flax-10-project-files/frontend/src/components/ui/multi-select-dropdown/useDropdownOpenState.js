/**
 * Multi-select dropdown open-state hook.
 */

import { useState } from "react";

export function useDropdownOpenState(forcedOpen, onOpenChange) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = forcedOpen !== undefined;
  const isOpen = isControlled ? forcedOpen : internalOpen;

  return {
    isOpen,
    updateOpen: createOpenUpdater(isControlled, isOpen, onOpenChange, setInternalOpen),
  };
}

function createOpenUpdater(isControlled, isOpen, onOpenChange, setInternalOpen) {
  return function updateOpen(value) {
    const nextOpen = typeof value === "function" ? value(isOpen) : value;
    if (!isControlled) setInternalOpen(nextOpen);
    if (onOpenChange) onOpenChange(nextOpen);
  };
}
