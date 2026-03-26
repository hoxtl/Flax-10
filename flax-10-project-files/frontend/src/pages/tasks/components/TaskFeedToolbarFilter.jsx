/*
 * Hover and click driven filter dropdown for the task feed toolbar.
 */

import { useCallback, useEffect, useRef } from "react";
import { Filter } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import { DROPDOWN_MOTION_PROPS } from "../../../components/common/dropdownMotion";
import TaskFilterPanel from "./TaskFilterPanel";

import styles from "./TaskFeedToolbar.module.css";

const FILTER_ORIGIN_STYLE = { originY: 0, originX: 1 };

function useHoverClose(onFilterOpenChange, isFilterOpen) {
  const hoverTimer = useRef(null);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hoverTimer.current);
    if (!isFilterOpen) onFilterOpenChange(true);
  }, [isFilterOpen, onFilterOpenChange]);

  const handleMouseLeave = useCallback(() => {
    hoverTimer.current = setTimeout(() => onFilterOpenChange(false), 200);
  }, [onFilterOpenChange]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };
}

function FilterButton({ isFilterOpen, onFilterOpenChange, activeFilterCount }) {
  return (
    <button
      type="button"
      className={styles.filterBtn}
      onClick={() => onFilterOpenChange((open) => !open)}
      aria-haspopup="dialog"
      aria-expanded={isFilterOpen}
    >
      <Filter size={14} />
      <span>Filter</span>
      {activeFilterCount > 0 && (
        <span className={styles.filterCount}>{activeFilterCount}</span>
      )}
    </button>
  );
}

function FilterPanelDialog({ panelProps }) {
  return (
    <Motion.div
      className={styles.filterPanel}
      role="dialog"
      aria-label="Task filters"
      onClick={(event) => event.stopPropagation()}
      {...DROPDOWN_MOTION_PROPS}
      style={FILTER_ORIGIN_STYLE}
    >
      <TaskFilterPanel {...panelProps} />
    </Motion.div>
  );
}

function FilterPanelShell({ filterAnchor, hoverHandlers, buttonProps, isFilterOpen, panelProps }) {
  return (
    <div className={styles.filterPanelWrap} ref={filterAnchor} {...hoverHandlers}>
      <FilterButton {...buttonProps} />
      <AnimatePresence>
        {isFilterOpen && <FilterPanelDialog panelProps={panelProps} />}
      </AnimatePresence>
    </div>
  );
}

export default function ToolbarFilterPanel({
  filterAnchor,
  isFilterOpen,
  onFilterOpenChange,
  activeFilterCount,
  panelProps,
}) {
  const hoverHandlers = useHoverClose(onFilterOpenChange, isFilterOpen);
  const buttonProps = { isFilterOpen, onFilterOpenChange, activeFilterCount };

  return (
    <FilterPanelShell
      filterAnchor={filterAnchor}
      hoverHandlers={hoverHandlers}
      buttonProps={buttonProps}
      isFilterOpen={isFilterOpen}
      panelProps={panelProps}
    />
  );
}
