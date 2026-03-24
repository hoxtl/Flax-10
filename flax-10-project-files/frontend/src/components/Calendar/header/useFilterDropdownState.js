/*
 * Filter dropdown state hook for calendar header.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTags } from "../../../context/TagContext";
import styles from "./CalendarHeaderUtils.module.css";

function normalizeActiveValues(active) {
  const source = Array.isArray(active) ? active.flat(Infinity) : [active];
  const values = source.map((value) => String(value).trim().toLowerCase());
  return values.filter(Boolean).includes("all") ? [] : values.filter(Boolean);
}

function mapTagObjects(tags) {
  const entries = (tags || []).map((tag) => [tag.label.toLowerCase(), tag]);
  const unique = Array.from(new Map(entries).values());
  return unique.map((tag) => ({ id: tag.label.toLowerCase(), label: tag.label }));
}

function getPopupShift(popupRect, viewportWidth) {
  const edgePadding = 8;
  if (popupRect.left < edgePadding) return edgePadding - popupRect.left;
  if (popupRect.right > viewportWidth - edgePadding) {
    return -(popupRect.right - (viewportWidth - edgePadding));
  }
  return 0;
}

function useOutsideClose(isOpen, ref, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = ({ target }) => !ref.current?.contains(target) && onClose();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, ref]);
}

function useHoverCloseDelay(setOpen) {
  const timeoutRef = useRef(null);
  const clearDelay = () => clearTimeout(timeoutRef.current);
  const open = () => {
    clearDelay();
    setOpen(true);
  };
  const close = () => {
    clearDelay();
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => clearDelay, []);
  return { open, close };
}

function readPopupShift(wrap) {
  const popup = wrap?.querySelector(`.${styles.filterPopup}`);
  if (!popup) return 0;
  return getPopupShift(popup.getBoundingClientRect(), window.innerWidth);
}

function cleanupPopupShift(frame, update) {
  cancelAnimationFrame(frame);
  window.removeEventListener("resize", update);
}

function usePopupShift(isOpen, ref) {
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (!isOpen) return undefined;
    const update = () => setShift(readPopupShift(ref.current));
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => cleanupPopupShift(frame, update);
  }, [isOpen, ref]);
  return isOpen ? shift : 0;
}

function useFilterData(active, tags) {
  const selectedValues = useMemo(() => normalizeActiveValues(active), [active]);
  const tagObjects = useMemo(() => mapTagObjects(tags), [tags]);
  const selectedTags = tagObjects.filter(({ id }) => selectedValues.includes(id));
  return { selectedValues, tagObjects, selectedTags };
}

function mapSelection(selected) {
  return selected.length ? selected.map(({ id }) => id) : "all";
}

function createPopupProps(allowManageTags, data, onChange, setIsOpen, setShowManager, shift) {
  return {
    allowManageTags,
    onManageTags: () => setIsOpen(false) || setShowManager(true),
    onSelectionChange: (selected) => onChange(mapSelection(selected)),
    selectedTags: data.selectedTags,
    shift,
    tags: data.tagObjects,
  };
}

function buildFilterDropdownResult(data, state, hover, isMobile, allowManageTags, onChange, shift) {
  const { isOpen, setIsOpen, showManager, setShowManager, wrapRef } = state;
  return {
    activeCount: data.selectedValues.length,
    allowManageTags,
    isOpen,
    onCloseManager: () => setShowManager(false),
    onMouseEnter: !isMobile ? hover.open : undefined,
    onMouseLeave: !isMobile ? hover.close : undefined,
    onToggle: () => setIsOpen((open) => !open),
    popupProps: createPopupProps(allowManageTags, data, onChange, setIsOpen, setShowManager, shift),
    showManager,
    wrapRef,
  };
}

export function useFilterDropdownState(active, allowManageTags, isMobile, onChange) {
  const { tags } = useTags();
  const wrapRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const hover = useHoverCloseDelay(setIsOpen);
  const shift = usePopupShift(isOpen, wrapRef);
  const data = useFilterData(active, tags);
  useOutsideClose(isOpen, wrapRef, () => setIsOpen(false));
  return buildFilterDropdownResult(data, { isOpen, setIsOpen, showManager, setShowManager, wrapRef }, hover, isMobile, allowManageTags, onChange, shift);
}
