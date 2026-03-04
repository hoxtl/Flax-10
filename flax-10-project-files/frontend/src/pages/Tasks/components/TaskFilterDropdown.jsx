/**
 * Combined filter for Tasks page — onboarding-style dropdown: card panel, warm palette, no orange.
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./TaskFeed.module.css";
import filterStyles from "./TaskFilterDropdown.module.css";

function FilterCheckbox({ checked, onToggle, id }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onToggle(id)}
      className={filterStyles.checkbox}
      onClick={(e) => e.stopPropagation()}
      aria-label={id}
    />
  );
}

function FilterTabs({ activeTab, setTab }) {
  return (
    <div className={filterStyles.tabs}>
      {["lists", "modules"].map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setTab(tab);
          }}
          className={`${filterStyles.tab} ${activeTab === tab ? filterStyles.tabActive : ""}`}
        >
          {tab === "lists" ? "Lists" : "Modules"}
        </button>
      ))}
    </div>
  );
}

function filterOptions(options, query, labelKey = "label") {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options.filter((o) => (o[labelKey] || "").toLowerCase().includes(q));
}

function getModulePrefix(code) {
  return (code || "").match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";
}

function groupModulesByPrefix(options) {
  const groups = {};
  options.forEach((opt) => {
    const prefix = getModulePrefix(opt.value);
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(opt);
  });
  return Object.keys(groups)
    .sort()
    .map((prefix) => ({ prefix, items: groups[prefix] }));
}

function ListItem({ option, isChecked, onToggle }) {
  return (
    <div
      className={filterStyles.item}
      onClick={() => onToggle(option.value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(option.value))}
    >
      <FilterCheckbox checked={isChecked} onToggle={onToggle} id={option.value} />
      <div className={filterStyles.itemText}>
        <span className={filterStyles.itemTitle}>{option.label}</span>
      </div>
    </div>
  );
}

function ModuleItem({ option, isChecked, onToggle }) {
  return (
    <div
      className={filterStyles.item}
      onClick={() => onToggle(option.value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(option.value))}
    >
      <FilterCheckbox checked={isChecked} onToggle={onToggle} id={option.value} />
      <div className={filterStyles.itemText}>
        <span className={filterStyles.itemTitle}>{option.label}</span>
      </div>
    </div>
  );
}

export function TaskFilterDropdown({
  listFilterOptions = [],
  moduleOptions = [],
  filterListIds = [],
  filterModuleCodes = [],
  onFilterByList,
  onFilterByModule,
  showListFilter = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("lists");
  const [listQuery, setListQuery] = useState("");
  const [moduleQuery, setModuleQuery] = useState("");
  const containerRef = useRef(null);

  const listOptions = useMemo(
    () => listFilterOptions.filter((o) => o.value !== ""),
    [listFilterOptions]
  );
  const moduleOptionsOnly = useMemo(
    () => moduleOptions.filter((o) => o.value !== ""),
    [moduleOptions]
  );

  const filteredLists = useMemo(
    () => filterOptions(listOptions, listQuery),
    [listOptions, listQuery]
  );
  const filteredModules = useMemo(
    () => filterOptions(moduleOptionsOnly, moduleQuery),
    [moduleOptionsOnly, moduleQuery]
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleList = (id) => {
    if (typeof onFilterByList !== "function") return;
    const set = new Set(filterListIds.map(String));
    if (set.has(String(id))) set.delete(String(id));
    else set.add(String(id));
    onFilterByList(Array.from(set));
  };

  const toggleModule = (code) => {
    if (typeof onFilterByModule !== "function") return;
    const set = new Set((filterModuleCodes || []).map(String));
    if (set.has(String(code))) set.delete(String(code));
    else set.add(String(code));
    onFilterByModule(Array.from(set));
  };

  const activeCount = (showListFilter ? filterListIds.length : 0) + (filterModuleCodes?.length || 0);
  const label = activeCount > 0 ? `Filter (${activeCount})` : "Filter";

  return (
    <div ref={containerRef} className={styles.taskFilterWrap}>
      <div className={styles.sortWrap}>
        <label className={styles.sortLabel}>FILTER</label>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={styles.taskFilterBtn}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{label}</span>
          <ChevronDown size={14} className={styles.taskFilterChevron} aria-hidden />
        </button>
      </div>
      {isOpen && (
        <div
          className={filterStyles.dropdown}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Filter by list or module"
        >
          <FilterTabs activeTab={activeTab} setTab={setActiveTab} />
          {activeTab === "lists" && (
            <>
              <input
                type="text"
                placeholder="Search lists..."
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                className={filterStyles.searchInput}
                autoFocus
              />
              <div className={filterStyles.listContainer}>
                {!showListFilter || listOptions.length === 0 ? (
                  <p className={filterStyles.emptyText}>No lists</p>
                ) : filteredLists.length === 0 ? (
                  <p className={filterStyles.emptyText}>No lists match</p>
                ) : (
                  <div className={filterStyles.optionList}>
                    {filteredLists.map((opt) => (
                      <ListItem
                        key={opt.value}
                        option={opt}
                        isChecked={filterListIds.map(String).includes(String(opt.value))}
                        onToggle={toggleList}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === "modules" && (
            <>
              <input
                type="text"
                placeholder="Search modules..."
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
                className={filterStyles.searchInput}
                autoFocus
              />
              <div className={filterStyles.listContainer}>
                {moduleOptionsOnly.length === 0 ? (
                  <p className={filterStyles.emptyText}>No modules</p>
                ) : filteredModules.length === 0 ? (
                  <p className={filterStyles.emptyText}>No modules match</p>
                ) : moduleQuery.trim() ? (
                  <div className={filterStyles.optionList}>
                    {filteredModules.map((opt) => (
                      <ModuleItem
                        key={opt.value}
                        option={opt}
                        isChecked={(filterModuleCodes || []).map(String).includes(String(opt.value))}
                        onToggle={toggleModule}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={filterStyles.groupContainer}>
                    {groupModulesByPrefix(filteredModules).map(({ prefix, items }) => (
                      <div key={prefix}>
                        <h4 className={filterStyles.groupHeading}>{prefix}</h4>
                        <div className={filterStyles.optionList}>
                          {items.map((opt) => (
                            <ModuleItem
                              key={opt.value}
                              option={opt}
                              isChecked={(filterModuleCodes || []).map(String).includes(String(opt.value))}
                              onToggle={toggleModule}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
