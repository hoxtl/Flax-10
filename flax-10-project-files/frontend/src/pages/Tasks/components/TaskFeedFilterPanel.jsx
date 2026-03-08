/**
 * Filter panel for the TaskFeed. Renders a toggle button that opens a
 * floating panel with list and module checkboxes.
 */

import { useRef, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./TaskFeedFilter.module.css";

const PANEL_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] };

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {Function} props.onToggle
 * @param {number}   props.activeFilterCount
 * @param {string}   props.activeFilterTab
 * @param {Function} props.onTabChange
 * @param {string}   props.filterQuery
 * @param {Function} props.onFilterQueryChange
 * @param {object[]} props.visibleListItems
 * @param {string[]} props.filterListIds
 * @param {Function} props.onToggleList
 * @param {object}   props.groupedVisibleModuleItems
 * @param {string[]} props.moduleGroupKeys
 * @param {string[]} props.filterModuleCodes
 * @param {Function} props.onToggleModule
 * @param {Function} props.onClearAll
 */
export default function TaskFeedFilterPanel({
  isOpen, onToggle, activeFilterCount,
  activeFilterTab, onTabChange,
  filterQuery, onFilterQueryChange,
  visibleListItems, filterListIds, onToggleList,
  groupedVisibleModuleItems, moduleGroupKeys,
  filterModuleCodes, onToggleModule,
  onClearAll,
}) {
  const filterRef = useRef(null);
  useOutsideClick(filterRef, isOpen, onToggle);

  return (
    <div className={styles.filterPanelWrap} ref={filterRef}>
      <FilterButton onClick={onToggle} isOpen={isOpen} count={activeFilterCount} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.filterPanel}
            role="dialog"
            aria-label="Task filters"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={PANEL_TRANSITION}
            style={{ originY: 0, originX: 1 }}
          >
            <FilterTabs activeTab={activeFilterTab} onTabChange={onTabChange} />
            <FilterSearch value={filterQuery} onChange={onFilterQueryChange} tab={activeFilterTab} />
            <div className={styles.filterListContainer}>
              {activeFilterTab === "lists"
                ? <ListFilterItems items={visibleListItems} selectedIds={filterListIds} onToggle={onToggleList} />
                : <ModuleFilterGroups groups={groupedVisibleModuleItems} keys={moduleGroupKeys} selected={filterModuleCodes} onToggle={onToggleModule} />
              }
            </div>
            <div className={styles.filterActions}>
              <button type="button" className={styles.filterClearBtn} onClick={onClearAll}>Clear all</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterButton({ onClick, isOpen, count }) {
  return (
    <button
      type="button"
      className={styles.filterBtn}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      <Filter size={14} />
      <span>Filter</span>
      {count > 0 && <span className={styles.filterCount}>{count}</span>}
    </button>
  );
}

function FilterTabs({ activeTab, onTabChange }) {
  return (
    <div className={styles.filterTabs}>
      <button type="button" className={`${styles.filterTab} ${activeTab === "lists" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("lists")}>Lists</button>
      <button type="button" className={`${styles.filterTab} ${activeTab === "modules" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("modules")}>Modules</button>
    </div>
  );
}

function FilterSearch({ value, onChange, tab }) {
  return (
    <div className={styles.filterSearchWrap}>
      <Search size={14} className={styles.filterSearchIcon} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={styles.filterSearchInput}
        placeholder={`Search ${tab}...`}
      />
    </div>
  );
}

function ListFilterItems({ items, selectedIds, onToggle }) {
  if (items.length === 0) return <p className={styles.filterEmptyText}>No lists found.</p>;
  return (
    <div className={styles.filterItems}>
      {items.map(item => (
        <FilterCheckbox
          key={item.value}
          label={item.label}
          checked={(selectedIds || []).map(String).includes(String(item.value))}
          onChange={() => onToggle(item.value)}
        />
      ))}
    </div>
  );
}

function ModuleFilterGroups({ groups, keys, selected, onToggle }) {
  if (keys.length === 0) return <p className={styles.filterEmptyText}>No modules found.</p>;
  return (
    <div className={styles.filterGroups}>
      {keys.map(group => (
        <div key={group} className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>{group}</h4>
          <div className={styles.filterItems}>
            {(groups[group] || []).map(item => (
              <FilterCheckbox
                key={item.value}
                label={item.label}
                checked={selected.includes(String(item.value))}
                onChange={() => onToggle(item.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className={styles.filterItemRow}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function useOutsideClick(ref, active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [active, ref, onClose]);
}
