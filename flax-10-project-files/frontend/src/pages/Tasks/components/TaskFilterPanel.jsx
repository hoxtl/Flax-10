/**
 * Dropdown panel for filtering tasks by list and module code.
 */

import { useMemo } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./TaskFeed.module.css";

function FilterCheckboxItem({ label, checked, onChange }) {
  return (
    <label className={styles.filterItemRow}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function ListsTab({ visibleListItems, filterListIds, onToggleList }) {
  if (visibleListItems.length === 0) return <p className={styles.filterEmptyText}>No lists found.</p>;
  return (
    <div className={styles.filterItems}>
      {visibleListItems.map((item) => (
        <FilterCheckboxItem
          key={item.value}
          label={item.label}
          checked={(filterListIds || []).map(String).includes(String(item.value))}
          onChange={() => onToggleList(item.value)}
        />
      ))}
    </div>
  );
}

function ModulesTab({ moduleGroupKeys, groupedModuleItems, filterModuleCodes, onToggleModule }) {
  if (moduleGroupKeys.length === 0) return <p className={styles.filterEmptyText}>No modules found.</p>;
  return (
    <div className={styles.filterGroups}>
      {moduleGroupKeys.map((group) => (
        <div key={group} className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>{group}</h4>
          <div className={styles.filterItems}>
            {(groupedModuleItems[group] || []).map((item) => (
              <FilterCheckboxItem
                key={item.value}
                label={item.label}
                checked={filterModuleCodes.includes(String(item.value))}
                onChange={() => onToggleModule(item.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Animated dropdown panel for filtering tasks by list or module.
 *
 * @param {object} props
 * @param {string} props.activeFilterTab
 * @param {Function} props.onTabChange
 * @param {string} props.filterQuery
 * @param {Function} props.onQueryChange
 * @param {object[]} props.visibleListItems
 * @param {string[]} props.filterListIds
 * @param {Function} props.onToggleList
 * @param {string[]} props.moduleGroupKeys
 * @param {object} props.groupedModuleItems
 * @param {string[]} props.filterModuleCodes
 * @param {Function} props.onToggleModule
 * @param {Function} props.onClearAll
 */
export default function TaskFilterPanel({
  activeFilterTab, onTabChange, filterQuery, onQueryChange,
  visibleListItems, filterListIds, onToggleList,
  moduleGroupKeys, groupedModuleItems, filterModuleCodes, onToggleModule,
  onClearAll,
}) {
  return (
    <AnimatePresence>
      <motion.div
        className={styles.filterPanel}
        role="dialog"
        aria-label="Task filters"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0, originX: 1 }}
      >
        <div className={styles.filterTabs}>
          <button type="button" className={`${styles.filterTab} ${activeFilterTab === "lists" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("lists")}>Lists</button>
          <button type="button" className={`${styles.filterTab} ${activeFilterTab === "modules" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("modules")}>Modules</button>
        </div>
        <div className={styles.filterSearchWrap}>
          <Search size={14} className={styles.filterSearchIcon} />
          <input type="text" value={filterQuery} onChange={e => onQueryChange(e.target.value)} className={styles.filterSearchInput} placeholder={`Search ${activeFilterTab}...`} />
        </div>
        <div className={styles.filterListContainer}>
          {activeFilterTab === "lists"   && <ListsTab   visibleListItems={visibleListItems} filterListIds={filterListIds} onToggleList={onToggleList} />}
          {activeFilterTab === "modules" && <ModulesTab moduleGroupKeys={moduleGroupKeys} groupedModuleItems={groupedModuleItems} filterModuleCodes={filterModuleCodes} onToggleModule={onToggleModule} />}
        </div>
        <div className={styles.filterActions}>
          <button type="button" className={styles.filterClearBtn} onClick={onClearAll}>Clear all</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
