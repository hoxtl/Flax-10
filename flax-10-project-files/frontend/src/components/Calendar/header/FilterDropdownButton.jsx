/*
 * FilterDropdownButton.jsx
 * Tag-based event filter with optional tag management entry point.
 */

import { Tag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TagsSelector } from "../../common/TagsSelector/TagsSelector";
import TagManagerModal from "../../Tags/TagManagerModal";
import styles from "./CalendarHeaderUtils.module.css";
import { useFilterDropdownState } from "./useFilterDropdownState";

const MotionDiv = motion.div;

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
