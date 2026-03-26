/*
 * Dropdown panel for filtering tasks by list and module code.
 */

import { Search } from "lucide-react";

import EmptyState from "../../../components/common/empty_state/EmptyState";
import { useAuth } from "../../../context/AuthContext";
import styles from "./TaskFeedToolbar.module.css";

function FilterCheckboxItem({ label, checked, onChange }) {
  return (
    <label className={styles.filterItemRow}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function ListsTab({ visibleListItems, filterListIds, onToggleList }) {
  if (visibleListItems.length === 0) {
    return <EmptyState icon="🗂️" title="No lists found" description="Try a different filter search." />;
  }
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

function ModuleGroupRow({ group, groupedModuleItems, filterModuleCodes, onToggleModule }) {
  const items = groupedModuleItems[group] || [];
  return (
    <div key={group} className={styles.filterGroup}>
      <h4 className={styles.filterGroupTitle}>{group}</h4>
      <div className={styles.filterItems}>
        {items.map((item) => (
          <FilterCheckboxItem
            key={item.value}
            label={item.label}
            checked={filterModuleCodes.includes(String(item.value))}
            onChange={() => onToggleModule(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterTabs({ activeFilterTab, onTabChange, hideModules }) {
  return (
    <div className={styles.filterTabs}>
      <button type="button" className={`${styles.filterTab} ${activeFilterTab === "lists" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("lists")}>Lists</button>
      {!hideModules && <button type="button" className={`${styles.filterTab} ${activeFilterTab === "modules" ? styles.filterTabActive : ""}`} onClick={() => onTabChange("modules")}>Modules</button>}
    </div>
  );
}

function FilterSearch({ filterQuery, onQueryChange, activeFilterTab }) {
  return (
    <div className={styles.filterSearchWrap}>
      <Search size={14} className={styles.filterSearchIcon} />
      <input type="text" value={filterQuery} onChange={e => onQueryChange(e.target.value)} className={styles.filterSearchInput} placeholder={`Search ${activeFilterTab}...`} />
    </div>
  );
}

function ModulesTab({ moduleGroupKeys, groupedModuleItems, filterModuleCodes, onToggleModule }) {
  if (moduleGroupKeys.length === 0) {
    return <EmptyState icon="📚" title="No modules found" description="Try a different filter search." />;
  }
  return (
    <div className={styles.filterGroups}>
      {moduleGroupKeys.map((group) => (
        <ModuleGroupRow key={group} group={group} groupedModuleItems={groupedModuleItems} filterModuleCodes={filterModuleCodes} onToggleModule={onToggleModule} />
      ))}
    </div>
  );
}

/* Dropdown panel for filtering tasks by list or module. */
export default function TaskFilterPanel(props) {
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const activeTab = isTeacher ? "lists" : props.activeFilterTab;
  return (
    <>
      <FilterTabs activeFilterTab={activeTab} onTabChange={props.onTabChange} hideModules={isTeacher} />
      <FilterSearch filterQuery={props.filterQuery} onQueryChange={props.onQueryChange} activeFilterTab={activeTab} />
      <div className={styles.filterListContainer}>
        {activeTab === "lists"   && <ListsTab   visibleListItems={props.visibleListItems} filterListIds={props.filterListIds} onToggleList={props.onToggleList} />}
        {activeTab === "modules" && <ModulesTab moduleGroupKeys={props.moduleGroupKeys} groupedModuleItems={props.groupedModuleItems} filterModuleCodes={props.filterModuleCodes} onToggleModule={props.onToggleModule} />}
      </div>
      <div className={styles.filterActions}>
        <button type="button" className={styles.filterClearBtn} onClick={props.onClearAll}>Clear all</button>
      </div>
    </>
  );
}
