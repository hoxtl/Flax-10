import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search, X, Plus, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TaskCard from "./TaskCard";
import CreateTaskBar from "./CreateTaskBar";
import EstTimeHelpBanner from "../../../components/ui/EstTimeHelpBanner";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";
import AllTasksCompleteCard from "./AllTasksCompleteCard";
import { getClearMessage } from "../../../lib/allTasksCompleteMessages";

import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

function sortTasks(tasks, sortBy, listMap) {
  return [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
      if (pd !== 0) return pd;
      return new Date(a.due_date || 0) - new Date(b.due_date || 0);
    }
    if (sortBy === "due") {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    if (sortBy === "alpha") return a.title.localeCompare(b.title);
    if (sortBy === "list") {
      const la = listMap?.[String(a.task_list)]?.name || "";
      const lb = listMap?.[String(b.task_list)]?.name || "";
      if (la !== lb) return la.localeCompare(lb);
      return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    }
    if (sortBy === "date_added") return (b.id ?? 0) - (a.id ?? 0);
    if (sortBy === "est_time") {
      const ab = a.estimated_blocks ?? 1;
      const bb = b.estimated_blocks ?? 1;
      if (ab !== bb) return ab - bb;
      return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    }
    const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    if (pd !== 0) return pd;
    return new Date(a.due_date || 0) - new Date(b.due_date || 0);
  });
}

function getListColor(list) {
  if (list?.color) return list.color;
  try {
    if (list?.id && typeof window !== "undefined") {
      const s = localStorage.getItem("listColor:" + list.id);
      if (s) return s;
    }
  } catch (_) {}
  return FOCUS_BLOCK_COLOURS_HEX[(list?.idx ?? 0) % FOCUS_BLOCK_COLOURS_HEX.length];
}

const SECTION_SHOW_LIMIT = 8;

function Section({
  title, emoji, tasks, sortBy, listMap, lists,
  onToggleComplete, onDeleteTask, onEditTask,
  defaultCollapsed = false, hideDueBadge = false,
  isOverdueSection = false, hideListBadge = false,
  completedCount = 0, sectionType = "default",
  applyLimit = false, searchQuery = "",
  emptyMessage = null,
  emptySub = null,
  emptyCardProps = null,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => sortTasks(tasks, sortBy, listMap), [tasks, sortBy, listMap]);

  const totalInGroup = tasks.length + completedCount;
  const progressPct = totalInGroup > 0 ? Math.round((completedCount / totalInGroup) * 100) : 0;

  const visibleTasks = applyLimit && !showAll ? sorted.slice(0, SECTION_SHOW_LIMIT) : sorted;
  const hiddenCount = applyLimit ? Math.max(0, sorted.length - SECTION_SHOW_LIMIT) : 0;

  const isEmpty = tasks.length === 0;
  const showEmptyState = isEmpty && (emptyMessage != null || emptyCardProps != null);
  if (isEmpty && !showEmptyState && completedCount === 0) return null;

  const accentCls = isOverdueSection ? styles.sectionAccentDanger : "";
  const emptyEmoji = (sectionType === "all" || sectionType === "overdue") ? "🗂️" : "✨";

  return (
    <div className={`${styles.section} ${accentCls} ${isOverdueSection ? styles.sectionOverdue : ""}`}>
      <button
        type="button"
        className={`${styles.sectionHeader} ${isOverdueSection ? styles.sectionHeaderDanger : ""}`}
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
      >
        <span className={styles.sectionIcon}>{emoji}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionStatsChip}>
          <span className={styles.sectionCountWrap}>
            {totalInGroup > 0 && (
              <svg className={styles.sectionRing} width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(123,103,81,0.1)" strokeWidth="2.5" />
                <circle cx="11" cy="11" r="9" fill="none"
                  className={`${styles.sectionRingFill} ${isOverdueSection ? styles.sectionRingDanger : ""}`}
                  strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${(2 * Math.PI * 9 * progressPct) / 100} ${2 * Math.PI * 9}`}
                  transform="rotate(-90 11 11)"
                />
              </svg>
            )}
            <span className={styles.sectionCountPill} aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
            {completedCount > 0 && (
              <span className={`${styles.sectionCountDone} ${collapsed ? styles.sectionCountDoneMuted : ""}`}>· {completedCount} done</span>
            )}
          </span>
          <span className={styles.sectionChevronBtn} aria-hidden>
            <motion.span
              className={styles.sectionChevron}
              animate={{ rotate: collapsed ? -90 : 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="section-body"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{
              height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2, ease: "easeOut" },
              y: { duration: 0.2, ease: "easeOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.sectionBody}>
              {showEmptyState ? (
                emptyCardProps ? (
                  <AllTasksCompleteCard
                    emoji="🎉"
                    message={emptyCardProps.message}
                    sub={emptyCardProps.sub}
                    ctaLabel={emptyCardProps.ctaLabel}
                    onCtaClick={emptyCardProps.onCtaClick}
                  />
                ) : (
                <div className={styles.sectionEmptyState}>
                  <span className={styles.sectionEmptyIcon} aria-hidden>{emptyEmoji}</span>
                  <p className={styles.sectionEmptyMessage}>{emptyMessage}</p>
                  {emptySub && <p className={styles.sectionEmptySub}>{emptySub}</p>}
                </div>
                )
              ) : (
                <>
                  {visibleTasks.map(task => {
                    const list = listMap[String(task.task_list)];
                    return (
                      <div key={task.id} className={styles.taskRow}>
                        <TaskCard
                          task={task}
                          listName={list?.name}
                          listColor={getListColor(list)}
                          lists={lists}
                          onToggle={() => {
                            onToggleComplete(task.id, task.completed);
                          }}
                          onDelete={() => onDeleteTask(task.id)}
                          onEdit={(data, meta) => onEditTask(task.id, data, meta)}
                          hideDueBadge={hideDueBadge}
                          hideListBadge={hideListBadge}
                          isOverdue={isOverdueSection}
                          searchQuery={searchQuery}
                        />
                      </div>
                    );
                  })}
                  {applyLimit && hiddenCount > 0 && (
                    <div className={styles.showMoreWrap}>
                      <button
                        type="button"
                        className={styles.showMoreBtn}
                        onClick={() => setShowAll(v => !v)}
                      >
                        {showAll ? "Show less ↑" : `Show all ${tasks.length} →`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TaskFeed({
  tasks,
  lists,
  activeFilter,
  activeListId,
  activeModuleCode,
  defaultDueDateForNewTask,
  onPlanTomorrow,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onCreateTask,
  onAddTask,
  filterListIds = [],
  onFilterByList,
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [showDone, setShowDone] = useState(true);
  const [filterModuleCodes, setFilterModuleCodes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("lists");
  const [filterQuery, setFilterQuery] = useState("");
  const searchInputRef = useRef(null);
  const filterRef = useRef(null);

  // Build list lookup map: id → { name, color, idx }
  const listMap = useMemo(() => {
    const map = {};
    (lists || []).forEach((l, idx) => {
      map[String(l.id)] = { ...l, idx };
    });
    return map;
  }, [lists]);

  // Apply module filter to tasks
  const tasksByModule = useMemo(() => {
    if (!filterModuleCodes || filterModuleCodes.length === 0) return tasks;
    const selected = new Set(filterModuleCodes.map(String));
    return tasks.filter((t) => selected.has(String(t.module_code || "")));
  }, [tasks, filterModuleCodes]);

  const pending = tasksByModule.filter(t => !t.completed);
  const completed = tasksByModule.filter(t => t.completed);

  const moduleOptions = useMemo(() => {
    const codes = [...new Set((tasks || []).map(t => t.module_code).filter(Boolean))].sort();
    return [{ value: "", label: "All modules" }, ...codes.map(c => ({ value: c, label: c }))];
  }, [tasks]);

  const listFilterOptions = useMemo(
    () => [
      { value: "", label: "All lists" },
      ...(lists || []).map((l) => ({ value: String(l.id), label: l.name || "List" })),
    ],
    [lists]
  );
  const listItems = useMemo(
    () => listFilterOptions.filter((o) => o.value !== ""),
    [listFilterOptions]
  );
  const moduleItems = useMemo(
    () => moduleOptions.filter((o) => o.value !== ""),
    [moduleOptions]
  );

  const visibleListItems = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return listItems;
    return listItems.filter((o) => o.label.toLowerCase().includes(q));
  }, [listItems, filterQuery]);

  const moduleCodePrefix = (code = "") => code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "Other";
  const groupedVisibleModuleItems = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const base = !q
      ? moduleItems
      : moduleItems.filter((o) => o.label.toLowerCase().includes(q));
    return base.reduce((acc, item) => {
      const k = moduleCodePrefix(item.value);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }, [moduleItems, filterQuery]);
  const moduleGroupKeys = useMemo(
    () => Object.keys(groupedVisibleModuleItems).sort(),
    [groupedVisibleModuleItems]
  );

  const toggleListFilter = (value) => {
    const v = String(value);
    const curr = new Set((filterListIds || []).map(String));
    if (curr.has(v)) curr.delete(v);
    else curr.add(v);
    onFilterByList?.(Array.from(curr));
  };
  const toggleModuleFilter = (value) => {
    const v = String(value);
    setFilterModuleCodes((prev) => (
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    ));
  };
  const clearAllFilters = () => {
    onFilterByList?.([]);
    setFilterModuleCodes([]);
    setFilterQuery("");
  };
  const activeFilterCount = (filterListIds?.length || 0) + filterModuleCodes.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return pending;
    const q = search.toLowerCase();
    return pending.filter(t => {
      const listName = listMap[String(t.task_list)]?.name || "";
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.module_code || "").toLowerCase().includes(q) ||
        (t.module_name || "").toLowerCase().includes(q) ||
        listName.toLowerCase().includes(q)
      );
    });
  }, [pending, search, listMap]);

  const filteredCompleted = useMemo(() => {
    if (!search.trim()) return completed;
    const q = search.toLowerCase();
    return completed.filter(t => {
      const listName = listMap[String(t.task_list)]?.name || "";
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.module_code || "").toLowerCase().includes(q) ||
        (t.module_name || "").toLowerCase().includes(q) ||
        listName.toLowerCase().includes(q)
      );
    });
  }, [completed, search, listMap]);

  const now = new Date();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

  const overdue = filtered.filter(t => t.due_date && new Date(t.due_date) < now && !t.completed && !isRoutineOrEventTask(t));
  const today = filtered.filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
  const thisWeek = filtered.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date); return d > todayEnd && d <= weekEnd; });
  const later = filtered.filter(t => !t.due_date || new Date(t.due_date) > weekEnd);

  const completedTodayCount = useMemo(() =>
    completed.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd).length,
    [completed]
  );
  const completedWeekCount = useMemo(() =>
    completed.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date); return d > todayEnd && d <= weekEnd; }).length,
    [completed]
  );
  const completedLaterCount = useMemo(() =>
    completed.filter(t => !t.due_date || new Date(t.due_date) > weekEnd).length,
    [completed]
  );

  const allTasksCombined = useMemo(
    () => [...overdue, ...today, ...thisWeek, ...later],
    [overdue, today, thisWeek, later]
  );
  const allTasksCompletedCount = completed.length;

  const hasAny = filtered.length > 0 || (search.trim() && filteredCompleted.length > 0);
  const isClearEmpty = tasks.length === 0 || pending.length === 0;
  const showSearchEmptyState = search.trim() && filtered.length === 0 && filteredCompleted.length === 0;

  const navigate = useNavigate();
  const todayEmptyMessage = useMemo(() => getClearMessage(), []);
  const todayEmptyCardProps = useMemo(() => ({
    message: todayEmptyMessage,
    sub: completedTodayCount > 0
      ? `${completedTodayCount} task${completedTodayCount !== 1 ? "s" : ""} completed today. Take a moment — you earned it.`
      : "No tasks due today.",
    ctaLabel: "Plan tomorrow →",
    onCtaClick: () => {
      if (typeof onPlanTomorrow === "function") onPlanTomorrow();
      else navigate("/tasks?open=fullPlanning");
    },
  }), [completedTodayCount, todayEmptyMessage, onPlanTomorrow, navigate]);

  const displayName = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!raw) return null;
      const u = JSON.parse(raw);
      return (u.first_name || "").trim() || (u.username || "").trim() || null;
    } catch {
      return null;
    }
  }, []);

  const activeList = useMemo(() => {
    if (!activeListId || !lists?.length) return null;
    return lists.find(l => String(l.id) === String(activeListId)) || null;
  }, [activeListId, lists]);

  const headerTitle = activeFilter === "today"
    ? "Today"
    : activeFilter === "this_week"
      ? "This Week"
      : activeFilter === "later"
        ? "Later"
        : activeFilter === "overdue"
        ? "Overdue"
        : activeList
          ? (activeModuleCode ? `${activeList.name || "List"}: ${activeModuleCode}` : (activeList.name || "List"))
          : (activeModuleCode || "All tasks");
  const sectionProps = {
    sortBy, listMap, lists,
    onToggleComplete, onDeleteTask, onEditTask,
    hideListBadge: !!activeListId,
    searchQuery: search,
  };

  // Keyboard shortcuts: / → focus search, n → focus quick-capture, Escape → clear search
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      const isEditing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.contentEditable === "true";
      if (e.key === "/" && !isEditing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "n" && !isEditing) {
        e.preventDefault();
        document.querySelector('input[aria-label="Task name"]')?.focus();
      }
      if (e.key === "Escape" && isEditing) {
        e.target.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;
    const onDown = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isFilterOpen]);

  return (
    <div className={styles.feed}>
      {/* Dynamic list header */}
      <header className={styles.listHeader} key={activeListId ?? "all"}>
        <div className={styles.listHeaderTitleWrap}>
          <h1
            className={styles.listHeaderTitle}
            title={headerTitle}
          >
            {headerTitle}
          </h1>
        </div>
        <div className={styles.listHeaderDivider} aria-hidden />
      </header>

      <div className={styles.subHeader}>
        <div className={styles.bannerRow}>
          <EstTimeHelpBanner
            message="Not sure how long it'll take? Ask Flax for a suggestion."
            ctaLabel="Ask Flax"
            initialMessage="Help me estimate how long this task might take — what time block should I pick?"
          />
        </div>
        <div className={styles.createRow}>
          {onAddTask ? (
            <div className={styles.createBarWrap}>
              <CreateTaskBar
                lists={lists}
                defaultListId={activeListId}
                defaultDueDate={defaultDueDateForNewTask}
                onAddTask={onAddTask}
              />
            </div>
          ) : (
            <div className={styles.subHeaderSpacer} aria-hidden />
          )}
          {onCreateTask && (
            <button type="button" className={styles.addBtn} onClick={onCreateTask}>
              <Plus size={13} /> Full Planning
            </button>
          )}
        </div>
        <div className={styles.quickAddDivider} aria-hidden />
        <div className={styles.toolbarStrip}>
          <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} aria-hidden />
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              placeholder="Search… ( / )"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setSearch(""); e.target.blur(); } }}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search"><X size={12} /></button>
            )}
          </div>
          <div className={styles.sortWrap}>
            <label className={styles.sortLabel}>SORT</label>
            <AnimatedDropdown
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "priority",   label: "Priority"      },
                { value: "due",        label: "Due date"      },
                { value: "alpha",      label: "A → Z"        },
                { value: "date_added", label: "Date added"    },
                { value: "est_time",   label: "Estimated time" },
              ]}
              className={styles.sortDropdown}
            />
          </div>
          <div className={styles.filterPanelWrap} ref={filterRef}>
            <button
              type="button"
              className={styles.filterBtn}
              onClick={() => setIsFilterOpen((o) => !o)}
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
            >
              <Filter size={14} />
              <span>Filter</span>
              {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
            </button>
            <AnimatePresence>
              {isFilterOpen && (
              <motion.div
                className={styles.filterPanel}
                role="dialog"
                aria-label="Task filters"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ originY: 0, originX: 1 }}
              >
                <div className={styles.filterTabs}>
                  <button
                    type="button"
                    className={`${styles.filterTab} ${activeFilterTab === "lists" ? styles.filterTabActive : ""}`}
                    onClick={() => setActiveFilterTab("lists")}
                  >
                    Lists
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTab} ${activeFilterTab === "modules" ? styles.filterTabActive : ""}`}
                    onClick={() => setActiveFilterTab("modules")}
                  >
                    Modules
                  </button>
                </div>
                <div className={styles.filterSearchWrap}>
                  <Search size={14} className={styles.filterSearchIcon} />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className={styles.filterSearchInput}
                    placeholder={`Search ${activeFilterTab}...`}
                  />
                </div>
                <div className={styles.filterListContainer}>
                  {activeFilterTab === "lists" && (
                    visibleListItems.length === 0 ? (
                      <p className={styles.filterEmptyText}>No lists found.</p>
                    ) : (
                      <div className={styles.filterItems}>
                        {visibleListItems.map((item) => {
                          const checked = (filterListIds || []).map(String).includes(String(item.value));
                          return (
                            <label key={item.value} className={styles.filterItemRow}>
                              <input type="checkbox" checked={checked} onChange={() => toggleListFilter(item.value)} />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )
                  )}
                  {activeFilterTab === "modules" && (
                    moduleGroupKeys.length === 0 ? (
                      <p className={styles.filterEmptyText}>No modules found.</p>
                    ) : (
                      <div className={styles.filterGroups}>
                        {moduleGroupKeys.map((group) => (
                          <div key={group} className={styles.filterGroup}>
                            <h4 className={styles.filterGroupTitle}>{group}</h4>
                            <div className={styles.filterItems}>
                              {(groupedVisibleModuleItems[group] || []).map((item) => {
                                const checked = filterModuleCodes.includes(String(item.value));
                                return (
                                  <label key={item.value} className={styles.filterItemRow}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleModuleFilter(item.value)} />
                                    <span>{item.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
                <div className={styles.filterActions}>
                  <button type="button" className={styles.filterClearBtn} onClick={clearAllFilters}>Clear all</button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </div>

      {/* Sections */}
      <div className={styles.sectionsWrap}>
        <div className={styles.sections} key={`sections-${activeListId ?? "all"}`}>
          {showSearchEmptyState && (
            <div className={styles.searchEmptyCard}>
              <span className={styles.searchEmptyEmoji}>🔍</span>
              <p className={styles.searchEmptyMessage}>No tasks match &ldquo;{search}&rdquo;</p>
              <p className={styles.searchEmptyHint}>Try a different keyword or check your spelling</p>
              <button type="button" className={styles.searchEmptyBtn} onClick={() => setSearch("")}>
                Clear search
              </button>
            </div>
          )}

          {overdue.length > 0 && activeFilter === "today" && (
            <Section
              title="Overdue" emoji="⚠️" tasks={overdue} hideDueBadge
              isOverdueSection sectionType="overdue"
              completedCount={0}
              {...sectionProps}
            />
          )}
          {activeFilter === "today" ? (
            <Section
              title="Today" emoji="📅" tasks={today} hideDueBadge
              sectionType="today" completedCount={completedTodayCount}
              emptyCardProps={todayEmptyCardProps}
              {...sectionProps}
            />
          ) : activeFilter === "overdue" ? (
            <Section
              title="Overdue"
              emoji="⚠️"
              tasks={filtered}
              sectionType="overdue"
              completedCount={0}
              isOverdueSection
              emptyMessage="No overdue tasks."
              {...sectionProps}
            />
          ) : activeFilter === "this_week" ? (
            <>
              <Section
                title="Today" emoji="📅" tasks={today} hideDueBadge
                sectionType="today" completedCount={completedTodayCount}
                emptyCardProps={todayEmptyCardProps}
                {...sectionProps}
              />
              <Section
                title="This week" emoji="🗓️" tasks={thisWeek}
                sectionType="thisWeek" completedCount={completedWeekCount}
                emptyMessage="Nothing else due this week."
                {...sectionProps}
              />
            </>
          ) : activeFilter === "later" ? (
            <Section
              title="Later" emoji="⏳" tasks={later}
              sectionType="later" completedCount={completedLaterCount}
              emptyMessage="No tasks due later."
              {...sectionProps}
            />
          ) : (
            <Section
              title="All tasks"
              emoji="📋"
              tasks={allTasksCombined}
              sectionType="all"
              completedCount={allTasksCompletedCount}
              applyLimit={allTasksCombined.length > SECTION_SHOW_LIMIT}
              emptyMessage="No tasks yet. Add one above or use Full Planning."
              {...sectionProps}
            />
          )}

          {filteredCompleted.length > 0 && (
            <div className={`${styles.completedSection} ${styles.sectionAccentDone}`}>
              <button type="button" className={styles.sectionHeader} onClick={() => setShowDone(s => !s)} aria-expanded={showDone}>
                <span className={styles.sectionIcon}>🎯</span>
                <span className={styles.sectionTitle}>Completed</span>
                <span className={styles.sectionStatsChip}>
                  <span className={styles.sectionCountWrap}>
                    <span className={styles.sectionCountPill} aria-label={`${filteredCompleted.length} tasks`}>{filteredCompleted.length}</span>
                  </span>
                  <span className={styles.sectionChevronBtn} aria-hidden>
                    <motion.span
                      className={styles.sectionChevron}
                      animate={{ rotate: showDone ? 0 : -90 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {showDone && (
                  <motion.div
                    key="completed-section-body"
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -4 }}
                    transition={{
                      height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.2, ease: "easeOut" },
                      y: { duration: 0.2, ease: "easeOut" },
                    }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className={styles.completedCards}>
                      {sortTasks(filteredCompleted, sortBy, listMap).map(task => {
                        const list = listMap[String(task.task_list)];
                        return (
                          <div key={task.id} className={styles.taskRow}>
                            <TaskCard
                              task={task}
                              listName={list?.name}
                              listColor={getListColor(list)}
                              lists={lists}
                              onToggle={() => onToggleComplete(task.id, task.completed)}
                              onDelete={() => onDeleteTask(task.id)}
                              onEdit={(data, meta) => onEditTask(task.id, data, meta)}
                              isCompletedSection
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
