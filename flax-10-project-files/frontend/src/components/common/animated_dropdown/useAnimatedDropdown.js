/*
 * Animated dropdown state hooks.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { buildMenuStyle, computeOpenDirection, filterFlat, filterGrouped, makeOutsideClickListener } from "./animatedDropdownUtils";

function useDropdownOptions(options, grouped) {
  return useMemo(
    () =>
      grouped
        ? options.flatMap((group) => group.options.map((option) => ({ ...option, group: group.label })))
        : options.map((option) => (typeof option === "string" ? { value: option, label: option } : option)),
    [grouped, options],
  );
}

function useOpenState(forceOpen, onOpenChange) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = forceOpen !== undefined;
  const isOpen = isControlled ? forceOpen : internalOpen;
  const updateOpen = (nextValue) => {
    const next = typeof nextValue === "function" ? nextValue(isOpen) : nextValue;
    if (!isControlled) setInternalOpen(next);
    if (onOpenChange) onOpenChange(next);
  };
  return { isOpen, updateOpen };
}

function useDropdownState(options, grouped, placeholder, value, onChange, hover, forceOpen, onOpenChange) {
  const { isOpen, updateOpen } = useOpenState(forceOpen, onOpenChange);
  const [query, setQuery] = useState("");
  const allOptions = useDropdownOptions(options, grouped);
  const selectedLabel = allOptions.find((option) => option.value === value)?.label || placeholder;
  const handleSelect = (nextValue) => { onChange(nextValue); updateOpen(false); setQuery(""); };
  const handleToggle = () => { if (!hover) { updateOpen(!isOpen); setQuery(""); } };
  return { isOpen, setIsOpen: updateOpen, query, setQuery, selectedLabel, handleSelect, handleToggle };
}

function createDirectionUpdater(containerRef, menuMaxHeight, allowFlipUpward, setOpenUpward, setCoords) {
  return () => {
    const result = computeOpenDirection(containerRef.current.getBoundingClientRect(), menuMaxHeight, allowFlipUpward);
    setOpenUpward(result.shouldOpenUpward);
    setCoords(result.coords);
  };
}

function useOpenDirection(containerRef, isOpen, menuMaxHeight = 260, allowFlipUpward = false) {
  const [openUpward, setOpenUpward] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const update = createDirectionUpdater(containerRef, menuMaxHeight, allowFlipUpward, setOpenUpward, setCoords);
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [allowFlipUpward, containerRef, isOpen, menuMaxHeight]);
  return { openUpward, coords };
}

function useClickOutside(containerRef, menuRef, setIsOpen, openOnHover) {
  useEffect(() => {
    if (openOnHover) return;
    const listener = makeOutsideClickListener(containerRef, menuRef, setIsOpen);
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [containerRef, menuRef, openOnHover, setIsOpen]);
}

function useHoverHandlers(openOnHover, setIsOpen, timeoutRef) {
  const handleMouseEnter = () => {
    if (!openOnHover) return;
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!openOnHover) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return { handleMouseEnter, handleMouseLeave };
}

function useDropdownRefs() {
  return { containerRef: useRef(null), menuRef: useRef(null), timeoutRef: useRef(null) };
}

export function useAnimatedDropdownState(props) {
  const { options, grouped, placeholder, value, onChange, openOnHover, isOpen: forceOpen, onOpenChange, menuMaxHeight, allowFlipUpward } = props;
  const { containerRef, menuRef, timeoutRef } = useDropdownRefs();
  const dropdownState = useDropdownState(options, grouped, placeholder, value, onChange, openOnHover, forceOpen, onOpenChange);
  const { openUpward, coords } = useOpenDirection(containerRef, dropdownState.isOpen, menuMaxHeight, allowFlipUpward);
  const hoverHandlers = useHoverHandlers(openOnHover, dropdownState.setIsOpen, timeoutRef);
  useClickOutside(containerRef, menuRef, dropdownState.setIsOpen, openOnHover);

  return { containerRef, menuRef, openUpward, coords, ...hoverHandlers, ...dropdownState };
}

export function getFilteredDropdownOptions(options, grouped, searchable, query) {
  if (!searchable) {
    return options;
  }
  return grouped ? filterGrouped(options, query) : filterFlat(options, query);
}

export { buildMenuStyle };
