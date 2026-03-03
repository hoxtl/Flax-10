import { useState, useMemo, useRef, useEffect, useCallback } from "react";

import TaskCard from "./TaskCard";
import CreateTaskBar from "./CreateTaskBar";
import EmptyStateCard from "../../../components/EmptyStateCard";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Subtitle by list type for dynamic header. */
function getListSubtitle(listName, listCategory, isEmpty) {
  if (isEmpty) return "This garden is currently empty. Ready to plant some goals?";
  const name = (listName || "").toLowerCase();
  const cat = (listCategory || "").toLowerCase();
  if (/internship|placement/i.test(name)) return "Progress stacks quietly. Treat each internship task as proof of your momentum.";
  if (/finance|budget|money/i.test(name)) return "Small money moves compound. Keep the system simple and consistent.";
  if (/health|wellness|fitness/i.test(name)) return "Protect your energy first. A steady body makes focused work easier.";
  if (cat === "uni" || /university|academic|reading list/i.test(name)) return "Academic excellence is a marathon, not a sprint. Focus on your core objectives.";
  if (cat === "personal" || /personal|health|wellness|finance|home/i.test(name)) return "Nurturing the gardener is as important as tending the garden. Balance is key.";
  if (cat === "society" || /internship|work|project|admin/i.test(name)) return "Brick by brick, system by system. Building the future one task at a time.";
  return "A clear mind leads to a clear path. What is the next right move for today?";
}

/** Routine/event tasks (meals, lectures, etc.) auto-pass when time has passed — exclude from Overdue. */
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
    // default: priority
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
  onTaskCompleted,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => sortTasks(tasks, sortBy, listMap), [tasks, sortBy, listMap]);

  const totalInGroup = tasks.length + completedCount;
  const progressPct = totalInGroup > 0 ? Math.round((completedCount / totalInGroup) * 100) : 0;

  const visibleTasks = applyLimit && !showAll ? sorted.slice(0, SECTION_SHOW_LIMIT) : sorted;
  const hiddenCount = applyLimit ? Math.max(0, sorted.length - SECTION_SHOW_LIMIT) : 0;

  // Show all-done celebration when all tasks in this date bucket are completed
  if (tasks.length === 0 && completedCount > 0) {
    return (
      <div className={styles.sectionAllDoneWrap}>
        <span className={styles.sectionAllDoneText}>
          ✨ All {completedCount} {completedCount === 1 ? "task" : "tasks"} done for {title.toLowerCase()}!
        </span>
      </div>
    );
  }

  if (tasks.length === 0) return null;

  const accentCls = isOverdueSection ? styles.sectionAccentDanger
    : sectionType === "today" ? styles.sectionAccentToday
    : sectionType === "week" ? styles.sectionAccentWeek
    : "";

  return (
    <div className={`${styles.section} ${isOverdueSection ? styles.sectionOverdue : ""}`}>
      <button
        className={`${styles.sectionHeader} ${isOverdueSection ? styles.sectionHeaderDanger : ""} ${accentCls}`}
        onClick={() => setCollapsed(c => !c)}
      >
        <span className={styles.sectionEmoji}>{emoji}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionCountWrap}>
          <span className={styles.sectionCountCircle} aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
          {completedCount > 0 && (
            <span className={styles.sectionCountDone}>· {completedCount} done</span>
          )}
        </span>
        <span className={`${styles.sectionChevron} ${collapsed ? styles.sectionChevronCollapsed : ""}`}>▼</span>
      </button>

      {totalInGroup > 0 && (
        <div className={styles.sectionProgressBar} aria-hidden>
          <div
            className={`${styles.sectionProgressFill} ${isOverdueSection ? styles.sectionProgressFillDanger : sectionType === "today" ? styles.sectionProgressFillToday : ""}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {!collapsed && (
        <div className={styles.sectionBody}>
          {visibleTasks.map(task => {
            const list = listMap[String(task.task_list)];
            return (
              <TaskCard
                key={task.id}
                task={task}
                listName={list?.name}
                listColor={getListColor(list)}
                lists={lists}
                onToggle={() => {
                  const wasIncomplete = !task.completed;
                  onToggleComplete(task.id, task.completed);
                  if (wasIncomplete && onTaskCompleted) onTaskCompleted(task);
                }}
                onDelete={() => onDeleteTask(task.id)}
                onEdit={data => onEditTask(task.id, data)}
                hideDueBadge={hideDueBadge}
                hideListBadge={hideListBadge}
                isOverdue={isOverdueSection}
                searchQuery={searchQuery}
              />
            );
          })}
          {applyLimit && hiddenCount > 0 && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? "Show less ↑" : `Show all ${tasks.length} →`}
            </button>
          )}
        </div>
      )}
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
  onToggleComplete,
  onTaskCompleted,
  onDeleteTask,
  onEditTask,
  onCreateTask,
  onAddTask,
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [showDone, setShowDone] = useState(true);
  const searchInputRef = useRef(null);

  // Build list lookup map: id → { name, color, idx }
  const listMap = useMemo(() => {
    const map = {};
    (lists || []).forEach((l, idx) => {
      map[String(l.id)] = { ...l, idx };
    });
    return map;
  }, [lists]);

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const filtered = useMemo(() => {
    if (!search.trim()) return pending;
    const q = search.toLowerCase();
    return pending.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.module_code || "").toLowerCase().includes(q)
    );
  }, [pending, search]);

  const now = new Date();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

  const overdue = filtered.filter(t => t.due_date && new Date(t.due_date) < dayStart && !t.completed && !isRoutineOrEventTask(t));
  const today = filtered.filter(t => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd);
  const thisWeek = filtered.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date); return d > todayEnd && d <= weekEnd; });
  const later = filtered.filter(t => !t.due_date || new Date(t.due_date) > weekEnd);

  // Per-section completed counts for progress bars and all-done celebrations
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

  const hasAny = filtered.length > 0;
  const isZenEmpty = tasks.length === 0 || pending.length === 0;
  const allCompleted = tasks.length > 0 && pending.length === 0;
  const showZenEmptyState = !hasAny && isZenEmpty;
  const showSearchEmptyState = !hasAny && !isZenEmpty;

  const zenMessage = allCompleted ? "The slate is clean. You've mastered your momentum for now. ✨" : null;
  const zenCtaLabel = allCompleted ? "Plan a new session" : "Add a new seed";

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

  const headerTitle = activeList
    ? (activeModuleCode ? `${activeList.name || "List"}: ${activeModuleCode}` : (activeList.name || "List"))
    : (activeModuleCode || "All tasks");
  const headerSubtitle = activeList
    ? getListSubtitle(activeList?.name, activeList?.category, tasks.length === 0)
    : null;

  const sectionProps = {
    sortBy, listMap, lists,
    onToggleComplete, onTaskCompleted, onDeleteTask, onEditTask,
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

  return (
    <div className={styles.feed}>
      {/* Dynamic list header */}
      <header className={styles.listHeader} key={activeListId ?? "all"}>
        <div className={styles.listHeaderTitleWrap}>
          <h1 className={styles.listHeaderTitle} title={headerTitle}>{headerTitle}</h1>
        </div>
        {headerSubtitle && <p className={styles.listHeaderSubtitle}>{headerSubtitle}</p>}
        <div className={styles.listHeaderDivider} aria-hidden />
      </header>

      {/* Quick capture + toolbar */}
      <div className={styles.subHeader}>
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
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>🔍</span>
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              placeholder="Search… ( / )"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setSearch(""); e.target.blur(); } }}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search">✕</button>
            )}
          </div>
          <div className={styles.sortWrap}>
            <label className={styles.sortLabel}>SORT</label>
            <AnimatedDropdown
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "priority",   label: "Priority"       },
                { value: "due",        label: "Due date"       },
                { value: "alpha",      label: "A → Z"          },
                { value: "list",       label: "List"           },
                { value: "date_added", label: "Date added"     },
                { value: "est_time",   label: "Estimated time" },
              ]}
              className={styles.sortDropdown}
            />
          </div>
          {onCreateTask && (
            <button type="button" className={styles.addBtn} onClick={onCreateTask}>
              + Full Planning
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className={styles.sectionsWrap}>
        <div className={styles.sections}>
          {showZenEmptyState && (
            <div className={styles.emptyState}>
              <EmptyStateCard
                displayName={displayName}
                sub={null}
                message={zenMessage}
                action={
                  onCreateTask ? (
                    <button type="button" className={styles.emptyStateAddBtn} onClick={onCreateTask}>
                      {zenCtaLabel}
                    </button>
                  ) : null
                }
              />
            </div>
          )}

          {showSearchEmptyState && (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateIcon} aria-hidden>🔍</span>
              <p className={styles.emptyStateText}>No tasks match &ldquo;{search}&rdquo;</p>
              <button type="button" className={styles.addBtn} onClick={() => setSearch("")}>
                Clear search
              </button>
            </div>
          )}

          {overdue.length > 0 && (
            <Section
              title="Overdue" emoji="⚠️" tasks={overdue} hideDueBadge
              isOverdueSection sectionType="overdue"
              completedCount={0}
              {...sectionProps}
            />
          )}
          <Section
            title="Today" emoji="📅" tasks={today} hideDueBadge
            sectionType="today" completedCount={completedTodayCount}
            {...sectionProps}
          />
          <Section
            title="This week" emoji="📆" tasks={thisWeek}
            sectionType="week" completedCount={completedWeekCount}
            applyLimit={thisWeek.length > SECTION_SHOW_LIMIT}
            {...sectionProps}
          />
          <Section
            title="Later" emoji="🗓️" tasks={later}
            sectionType="later" completedCount={completedLaterCount}
            defaultCollapsed={later.length > 8}
            applyLimit={later.length > SECTION_SHOW_LIMIT}
            {...sectionProps}
          />

          {completed.length > 0 && (
            <div className={styles.completedSection}>
              <button className={styles.completedToggle} onClick={() => setShowDone(s => !s)}>
                <span>🌱 Recently Harvested</span>
                <span className={styles.completedSub}>Completed</span>
                <span className={styles.sectionCountCircle} aria-label={`${completed.length} tasks`}>{completed.length}</span>
                <span className={`${styles.sectionChevron} ${!showDone ? styles.sectionChevronCollapsed : ""}`}>▼</span>
              </button>
              {showDone && (
                <div className={styles.completedCards}>
                  {sortTasks(completed, sortBy, listMap).map(task => {
                    const list = listMap[String(task.task_list)];
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        listName={list?.name}
                        listColor={getListColor(list)}
                        lists={lists}
                        onToggle={() => onToggleComplete(task.id, task.completed)}
                        onDelete={() => onDeleteTask(task.id)}
                        onEdit={data => onEditTask(task.id, data)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
