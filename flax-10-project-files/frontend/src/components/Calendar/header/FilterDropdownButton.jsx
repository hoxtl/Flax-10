/*
 * FilterDropdownButton.jsx
 * Tag-based event filter with optional tag management entry point.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTags } from "../../../context/TagContext";
import { TagsSelector } from "../../common/TagsSelector/TagsSelector";
import TagManagerModal from "../../Tags/TagManagerModal";
import styles from "./CalendarHeaderUtils.module.css";

const MotionDiv = motion.div;

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

function readPopupShift(wrap) {
  const popup = wrap?.querySelector(`.${styles.filterPopup}`);
  if (!popup) return 0;
  return getPopupShift(popup.getBoundingClientRect(), window.innerWidth);
}

function cleanupPopupShift(frame, update) {
  cancelAnimationFrame(frame);
  window.removeEventListener("resize", update);
}

function FilterTrigger({ activeCount, isOpen, onClick }) {
  const activeClass = isOpen || activeCount > 0 ? styles.filterTriggerBtnActive : "";
  return (
    <button
      type="button"
      aria-label="Filter events"
      className={`${styles.filterTriggerBtn} ${activeClass}`}
      onClick={onClick}
    >
      <Tag size={18} />
      {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
    </button>
  );
}

function ManageTagsButton({ onClick }) {
  return (
    <button type="button" className={styles.filterManageBtn} onClick={onClick}>
      Manage tags…
    </button>
  );
}

function FilterPopup({
  allowManageTags,
  onManageTags,
  onSelectionChange,
  selectedTags,
  shift,
  tags,
}) {
  return (
    <PopupMotion shift={shift}>
      <FilterPopupHeader allowManageTags={allowManageTags} onManageTags={onManageTags} />
      <TagsSelector tags={tags} selectedTags={selectedTags} onSelectionChange={onSelectionChange} />
    </PopupMotion>
  );
}

function mapSelection(selected) {
  return selected.length ? selected.map(({ id }) => id) : "all";
}

function FilterPopupHeader({ allowManageTags, onManageTags }) {
  return (
    <div className={styles.filterPopupHeader}>
      <span className={styles.filterPopupTitle}>Filter by tag</span>
      {allowManageTags && <ManageTagsButton onClick={onManageTags} />}
    </div>
  );
}

function PopupMotion({ children, shift }) {
  return (
    <MotionDiv
      className={styles.filterPopup}
      style={{ right: shift ? `${-shift}px` : undefined }}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </MotionDiv>
  );
}

function useFilterData(active, tags) {
  const selectedValues = useMemo(() => normalizeActiveValues(active), [active]);
  const tagObjects = useMemo(() => mapTagObjects(tags), [tags]);
  const selectedTags = tagObjects.filter(({ id }) => selectedValues.includes(id));
  return { selectedValues, tagObjects, selectedTags };
}

function FilterManagerModal({ allowManageTags, showManager, onClose }) {
  if (!showManager || !allowManageTags) return null;
  return <TagManagerModal onClose={onClose} />;
}

function FilterDropdownContent({ activeCount, isOpen, onMouseEnter, onMouseLeave, onToggle, popupProps, wrapRef }) {
  return (
    <div className={styles.filterWrap} ref={wrapRef} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <FilterTrigger activeCount={activeCount} isOpen={isOpen} onClick={onToggle} />
      <AnimatePresence>{isOpen && <FilterPopup {...popupProps} />}</AnimatePresence>
    </div>
  );
}

function useFilterDropdownState(active, allowManageTags, isMobile, onChange) {
  const { tags } = useTags();
  const wrapRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const hover = useHoverCloseDelay(setIsOpen);
  const shift = usePopupShift(isOpen, wrapRef);
  const data = useFilterData(active, tags);
  useOutsideClose(isOpen, wrapRef, () => setIsOpen(false));
  return { activeCount: data.selectedValues.length, allowManageTags, isOpen, onCloseManager: () => setShowManager(false), onMouseEnter: !isMobile ? hover.open : undefined, onMouseLeave: !isMobile ? hover.close : undefined, onToggle: () => setIsOpen((open) => !open), popupProps: createPopupProps(allowManageTags, data, onChange, setIsOpen, setShowManager, shift), showManager, wrapRef };
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

export function FilterDropdownButton({
  active,
  onChange,
  allowManageTags = true,
  isMobile = false,
}) {
  const state = useFilterDropdownState(active, allowManageTags, isMobile, onChange);
  return (
    <>
      <FilterDropdownContent {...state} />
      <FilterManagerModal {...state} onClose={state.onCloseManager} />
    </>
  );
}
