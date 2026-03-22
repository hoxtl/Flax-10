/**
 * Multi-select dropdown interaction hooks.
 */

import { useEffect, useRef } from "react";

export function useDropdownRootRef() {
  return useRef(null);
}

export function useDropdownHoverTimeout() {
  return useRef(null);
}

export function useCloseOnOutsideClick(isOpen, rootRef, updateOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleMouseDown = createOutsideClickHandler(rootRef, updateOpen);
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, rootRef, updateOpen]);
}

export function createHoverHandlers(openOnHover, hoverTimeoutRef, updateOpen) {
  return {
    onMouseEnter: () => handleMouseEnter(openOnHover, hoverTimeoutRef, updateOpen),
    onMouseLeave: () => handleMouseLeave(openOnHover, hoverTimeoutRef, updateOpen),
  };
}

function createOutsideClickHandler(rootRef, updateOpen) {
  return function handleMouseDown(event) {
    if (rootRef.current?.contains(event.target)) return;
    updateOpen(false);
  };
}

function handleMouseEnter(openOnHover, hoverTimeoutRef, updateOpen) {
  if (!openOnHover) return;
  clearTimeout(hoverTimeoutRef.current);
  updateOpen(true);
}

function handleMouseLeave(openOnHover, hoverTimeoutRef, updateOpen) {
  if (!openOnHover) return;
  hoverTimeoutRef.current = setTimeout(() => updateOpen(false), 140);
}
