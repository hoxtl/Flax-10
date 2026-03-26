/*
 * Shared filter popover wrapper used by tasks and the timer task picker.
 */

import { useRef, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import TaskFilterPanel from "./TaskFilterPanel";
import styles from "./TaskFeedToolbar.module.css";

function FilterButton({ isOpen, count, onToggle }) {
  return (
    <button type="button" className={styles.filterBtn} onClick={onToggle} aria-haspopup="dialog" aria-expanded={isOpen}>
      <Filter size={14} />
      <span>Filter</span>
      {count > 0 && <span className={styles.filterCount}>{count}</span>}
    </button>
  );
}

function useHoverPanel(isOpen, onToggle) {
  const hoverTimer = useRef(null);
  const onMouseEnter = useCallback(() => { clearTimeout(hoverTimer.current); if (!isOpen) onToggle(); }, [isOpen, onToggle]);
  const onMouseLeave = useCallback(() => { hoverTimer.current = setTimeout(() => { if (isOpen) onToggle(); }, 200); }, [isOpen, onToggle]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  return { onMouseEnter, onMouseLeave };
}

export default function TaskFeedFilterPanel({ isOpen, onToggle, activeFilterCount, activeFilterTab, onTabChange, filterQuery, onFilterQueryChange, visibleListItems, filterListIds, onToggleList, groupedVisibleModuleItems, moduleGroupKeys, filterModuleCodes, onToggleModule, onClearAll, containerRef = null }) {
  const hoverProps = useHoverPanel(isOpen, onToggle);
  const panelProps = { activeFilterTab, onTabChange, filterQuery, onQueryChange: onFilterQueryChange, visibleListItems, filterListIds, onToggleList, moduleGroupKeys, groupedModuleItems: groupedVisibleModuleItems, filterModuleCodes, onToggleModule, onClearAll };
  return (
    <div ref={containerRef} className={styles.filterPanelWrap} {...hoverProps}>
      <FilterButton isOpen={isOpen} count={activeFilterCount} onToggle={onToggle} />
      <AnimatePresence>{isOpen && <Motion.div className={styles.filterPanel} role="dialog" aria-label="Task filters" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ originY: 0, originX: 1 }}><TaskFilterPanel {...panelProps} /></Motion.div>}</AnimatePresence>
    </div>
  );
}
